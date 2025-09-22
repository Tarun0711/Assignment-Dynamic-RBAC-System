import Post from '../models/Post.js';
import { sendSuccessResponse, sendErrorResponse, asyncHandler } from '../utils/responseUtils.js';
import { sanitizeInput, validatePagination, validateSort, isValidObjectId } from '../utils/validators.js';

/**
 * Get all posts
 * @route GET /api/posts
 * @access Public (with optional authentication for additional data)
 */
export const getPosts = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'publishedAt', 
    sortOrder = 'desc', 
    search, 
    status,
    author,
    tag
  } = req.query;

  // Validate pagination
  const { page: validPage, limit: validLimit, skip } = validatePagination(page, limit);

  // Validate sorting
  const sortOptions = validateSort(
    sortBy, 
    sortOrder, 
    ['title', 'publishedAt', 'createdAt', 'updatedAt', 'viewCount', 'likesCount']
  );

  // Build filter - only show published posts for non-authenticated users
  const filter = { isDeleted: false };

  // If user is not authenticated or doesn't have post.read permission, only show published posts
  if (!req.user || !(await req.user.hasPermission('post.read'))) {
    filter.status = 'published';
    filter.publishedAt = { $lte: new Date() };
  } else if (status) {
    filter.status = status;
  }

  if (search) {
    const searchRegex = new RegExp(sanitizeInput(search), 'i');
    filter.$or = [
      { title: searchRegex },
      { content: searchRegex },
      { excerpt: searchRegex }
    ];
  }

  if (author && isValidObjectId(author)) {
    filter.author = author;
  }

  if (tag) {
    filter.tags = { $in: [sanitizeInput(tag).toLowerCase()] };
  }

  // Get posts with pagination
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('author', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(validLimit),
    Post.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / validLimit);

  const pagination = {
    page: validPage,
    totalPages,
    totalItems: total,
    limit: validLimit,
    hasNextPage: validPage < totalPages,
    hasPrevPage: validPage > 1
  };

  sendSuccessResponse(res, 200, posts, 'Posts retrieved successfully', { pagination });
});

/**
 * Get single post by ID
 * @route GET /api/posts/:id
 * @access Public
 */
export const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid post ID');
  }

  const post = await Post.findById(id)
    .populate('author', 'name email')
    .populate('likes.user', 'name email');

  if (!post) {
    return sendErrorResponse(res, 404, 'Post not found');
  }

  // Check if post is deleted
  if (post.isDeleted) {
    return sendErrorResponse(res, 404, 'Post not found');
  }

  // Check if post is published (for non-authenticated users or users without post.read permission)
  if (!req.user || !(await req.user.hasPermission('post.read'))) {
    if (post.status !== 'published' || post.publishedAt > new Date()) {
      return sendErrorResponse(res, 404, 'Post not found');
    }
  }

  // Increment view count
  await post.incrementViews();

  // Check if current user has liked the post
  const isLikedByUser = req.user ? post.likes.some(like => 
    like.user._id.toString() === req.user._id.toString()
  ) : false;

  sendSuccessResponse(res, 200, {
    ...post.toObject(),
    isLikedByUser
  }, 'Post retrieved successfully');
});

/**
 * Create new post
 * @route POST /api/posts
 * @access Private (requires post.create permission)
 */
export const createPost = asyncHandler(async (req, res) => {
  const { title, content, excerpt, status = 'draft', tags = [] } = req.body;

  // Input validation
  if (!title || !content) {
    return sendErrorResponse(res, 400, 'Title and content are required');
  }

  // Validate status
  if (!['draft', 'published', 'archived'].includes(status)) {
    return sendErrorResponse(res, 400, 'Invalid status. Must be draft, published, or archived');
  }

  // Sanitize inputs
  const sanitizedTitle = sanitizeInput(title);
  const sanitizedContent = sanitizeInput(content);
  const sanitizedExcerpt = excerpt ? sanitizeInput(excerpt) : null;
  const sanitizedTags = tags.map(tag => sanitizeInput(tag).toLowerCase());

  // Create post
  const post = await Post.create({
    title: sanitizedTitle,
    content: sanitizedContent,
    excerpt: sanitizedExcerpt,
    status,
    tags: sanitizedTags,
    author: req.user._id
  });

  await post.populate('author', 'name email');

  sendSuccessResponse(res, 201, post, 'Post created successfully');
});

/**
 * Update post
 * @route PUT /api/posts/:id
 * @access Private (requires post.update permission or ownership)
 */
export const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, status, tags } = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid post ID');
  }

  const post = await Post.findById(id).populate('author', 'name email');

  if (!post) {
    return sendErrorResponse(res, 404, 'Post not found');
  }

  if (post.isDeleted) {
    return sendErrorResponse(res, 404, 'Post not found');
  }

  // Check ownership or post.update permission
  const hasUpdatePermission = await req.user.hasPermission('post.update');
  const isAuthor = post.author._id.toString() === req.user._id.toString();

  if (!hasUpdatePermission && !isAuthor) {
    return sendErrorResponse(res, 403, 'Access denied. You can only update your own posts unless you have update permissions.');
  }

  // Update fields
  if (title) {
    post.title = sanitizeInput(title);
  }

  if (content) {
    post.content = sanitizeInput(content);
  }

  if (excerpt !== undefined) {
    post.excerpt = excerpt ? sanitizeInput(excerpt) : null;
  }

  if (status && ['draft', 'published', 'archived'].includes(status)) {
    post.status = status;
  }

  if (Array.isArray(tags)) {
    post.tags = tags.map(tag => sanitizeInput(tag).toLowerCase());
  }

  await post.save();

  sendSuccessResponse(res, 200, post, 'Post updated successfully');
});

/**
 * Delete post
 * @route DELETE /api/posts/:id
 * @access Private (requires post.delete permission or ownership)
 */
export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid post ID');
  }

  const post = await Post.findById(id).populate('author', 'name email');

  if (!post) {
    return sendErrorResponse(res, 404, 'Post not found');
  }

  if (post.isDeleted) {
    return sendErrorResponse(res, 404, 'Post not found');
  }

  // Check ownership or post.delete permission
  const hasDeletePermission = await req.user.hasPermission('post.delete');
  const isAuthor = post.author._id.toString() === req.user._id.toString();

  if (!hasDeletePermission && !isAuthor) {
    return sendErrorResponse(res, 403, 'Access denied. You can only delete your own posts unless you have delete permissions.');
  }

  // Soft delete the post
  await post.softDelete(req.user._id);

  sendSuccessResponse(res, 200, null, 'Post deleted successfully');
});

/**
 * Like/Unlike post
 * @route POST /api/posts/:id/like
 * @access Private
 */
export const toggleLikePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid post ID');
  }

  const post = await Post.findById(id);

  if (!post) {
    return sendErrorResponse(res, 404, 'Post not found');
  }

  if (post.isDeleted || post.status !== 'published') {
    return sendErrorResponse(res, 404, 'Post not found');
  }

  const isLiked = await post.toggleLike(req.user._id);

  sendSuccessResponse(res, 200, {
    isLiked,
    likesCount: post.likesCount
  }, isLiked ? 'Post liked successfully' : 'Post unliked successfully');
});

/**
 * Get user's own posts
 * @route GET /api/posts/my
 * @access Private
 */
export const getMyPosts = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc', 
    status 
  } = req.query;

  // Validate pagination
  const { page: validPage, limit: validLimit, skip } = validatePagination(page, limit);

  // Validate sorting
  const sortOptions = validateSort(
    sortBy, 
    sortOrder, 
    ['title', 'publishedAt', 'createdAt', 'updatedAt', 'viewCount', 'status']
  );

  // Build filter
  const filter = {
    author: req.user._id,
    isDeleted: false
  };

  if (status && ['draft', 'published', 'archived'].includes(status)) {
    filter.status = status;
  }

  // Get posts with pagination
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('author', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(validLimit),
    Post.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / validLimit);

  const pagination = {
    page: validPage,
    totalPages,
    totalItems: total,
    limit: validLimit,
    hasNextPage: validPage < totalPages,
    hasPrevPage: validPage > 1
  };

  sendSuccessResponse(res, 200, posts, 'Your posts retrieved successfully', { pagination });
});

/**
 * Restore deleted post
 * @route POST /api/posts/:id/restore
 * @access Private (requires post.delete permission)
 */
export const restorePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, 400, 'Invalid post ID');
  }

  const post = await Post.findById(id).populate('author', 'name email');

  if (!post) {
    return sendErrorResponse(res, 404, 'Post not found');
  }

  if (!post.isDeleted) {
    return sendErrorResponse(res, 400, 'Post is not deleted');
  }

  // Check post.delete permission (required to restore)
  const hasDeletePermission = await req.user.hasPermission('post.delete');
  if (!hasDeletePermission) {
    return sendErrorResponse(res, 403, 'Access denied. Post restoration requires delete permissions.');
  }

  await post.restore();

  sendSuccessResponse(res, 200, post, 'Post restored successfully');
});

/**
 * Get post statistics
 * @route GET /api/posts/stats
 * @access Private (requires post.read permission)
 */
export const getPostStats = asyncHandler(async (req, res) => {
  // Overall statistics
  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    archivedPosts,
    deletedPosts
  ] = await Promise.all([
    Post.countDocuments({ isDeleted: false }),
    Post.countDocuments({ status: 'published', isDeleted: false }),
    Post.countDocuments({ status: 'draft', isDeleted: false }),
    Post.countDocuments({ status: 'archived', isDeleted: false }),
    Post.countDocuments({ isDeleted: true })
  ]);

  // Posts by author
  const postsByAuthor = await Post.aggregate([
    { $match: { isDeleted: false } },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorInfo'
      }
    },
    {
      $group: {
        _id: '$author',
        authorName: { $first: { $arrayElemAt: ['$authorInfo.name', 0] } },
        authorEmail: { $first: { $arrayElemAt: ['$authorInfo.email', 0] } },
        count: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalLikes: { $sum: { $size: '$likes' } }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Most popular posts
  const popularPosts = await Post.find({ isDeleted: false, status: 'published' })
    .populate('author', 'name email')
    .sort({ viewCount: -1 })
    .limit(5)
    .select('title viewCount likesCount publishedAt');

  // Tag statistics
  const tagStats = await Post.aggregate([
    { $match: { isDeleted: false, status: 'published' } },
    { $unwind: '$tags' },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  sendSuccessResponse(res, 200, {
    totalPosts,
    publishedPosts,
    draftPosts,
    archivedPosts,
    deletedPosts,
    postsByAuthor,
    popularPosts,
    topTags: tagStats.map(tag => ({ tag: tag._id, count: tag.count }))
  }, 'Post statistics retrieved successfully');
});