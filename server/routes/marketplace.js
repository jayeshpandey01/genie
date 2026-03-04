import express from "express";
import { authenticateUser, authenticateAdmin, checkOwnership, optionalAuth } from "../middleware/auth.js";
import { validate, validateQuery, schemas, searchLimiter } from "../middleware/validation.js";
import Listing from "../models/Listing.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { deleteProcessedImage } from "../services/imageProcessingService.js";
import { getImageUrls } from "../services/imageProcessingService.js";
import emailService from "../services/emailService.js";

const router = express.Router();

// Utility function to transform listing data with processed image URLs
const transformListingWithImageUrls = (listing) => {
    const listingObj = listing.toObject ? listing.toObject() : listing;
    
    // Transform images array to include URLs for all sizes
    if (listingObj.images && listingObj.images.length > 0) {
        listingObj.imageUrls = listingObj.images.map(filename => ({
            filename,
            urls: getImageUrls(filename)
        }));
    } else {
        listingObj.imageUrls = [];
    }
    
    return listingObj;
};

// Utility function to transform multiple listings
const transformListingsWithImageUrls = (listings) => {
    return listings.map(transformListingWithImageUrls);
};

// Utility function to escape regex special characters
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Get all listings with search, filtering, and pagination
// GET /api/marketplace/listings?page=1&limit=12&search=laptop&category=electronics&priceMin=100&priceMax=1000&condition=good&location=city&sortBy=createdAt&sortOrder=desc
router.get("/listings", searchLimiter, validateQuery(schemas.search), optionalAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search,
            category,
            priceMin,
            priceMax,
            condition,
            location,
            listingType, // 'all', 'sale', 'rent'
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query filters with validation
        const filters = { status: 'active' };

        // Listing type filter (sale/rent)
        if (listingType) {
            if (listingType === 'rent') {
                filters.isRental = true;
            } else if (listingType === 'sale') {
                filters.isRental = { $ne: true };
            }
            // 'all' or undefined shows both
        }

        // Category filter - validate against existing categories
        if (category) {
            const validCategory = await Category.findOne({ 
                $or: [
                    { slug: category },
                    { name: { $regex: `^${escapeRegex(category)}$`, $options: 'i' } }
                ]
            });
            
            if (validCategory) {
                filters.category = validCategory.slug;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category specified'
                });
            }
        }

        // Price range filter with validation
        if (priceMin || priceMax) {
            filters.price = {};
            if (priceMin) {
                const min = parseFloat(priceMin);
                if (min < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Minimum price cannot be negative'
                    });
                }
                filters.price.$gte = min;
            }
            if (priceMax) {
                const max = parseFloat(priceMax);
                if (max < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Maximum price cannot be negative'
                    });
                }
                filters.price.$lte = max;
            }
            
            // Validate price range
            if (priceMin && priceMax && parseFloat(priceMin) > parseFloat(priceMax)) {
                return res.status(400).json({
                    success: false,
                    message: 'Minimum price cannot be greater than maximum price'
                });
            }
        }

        // Condition filter with validation
        if (condition) {
            const validConditions = ['new', 'like-new', 'good', 'fair', 'poor'];
            if (Array.isArray(condition)) {
                const invalidConditions = condition.filter(c => !validConditions.includes(c));
                if (invalidConditions.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid conditions: ${invalidConditions.join(', ')}`
                    });
                }
                filters.condition = { $in: condition };
            } else {
                if (!validConditions.includes(condition)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid condition: ${condition}`
                    });
                }
                filters.condition = condition;
            }
        }

        // Location filter (case-insensitive partial match) with regex escaping
        if (location) {
            const escapedLocation = escapeRegex(location.trim());
            filters.location = { $regex: escapedLocation, $options: 'i' };
        }

        // Build query with pagination limits
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(Math.max(1, parseInt(limit)), 50); // Cap at 50 items per page
        const skip = (pageNum - 1) * limitNum;

        // Enhanced text search with fallback strategies and security
        if (search) {
            const searchTerm = search.trim();
            
            if (searchTerm.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Search term cannot be empty'
                });
            }
            
            if (searchTerm.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Search term too long'
                });
            }
            
            // Escape search term for regex to prevent ReDoS attacks
            const escapedSearchTerm = escapeRegex(searchTerm);
            
            let textSearchResults = [];
            let regexSearchResults = [];
            
            try {
                // Strategy 1: Full text search (highest priority)
                const textQuery = Listing.find({
                    ...filters,
                    $text: { $search: searchTerm }
                })
                .populate('seller', 'first_name last_name phone email')
                .select({ score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
                .limit(100); // Limit initial results to prevent memory issues
                
                textSearchResults = await textQuery.exec();
            } catch (error) {
                console.log('Text search failed, using regex fallback:', error.message);
            }
            
            // Strategy 2: If text search yields few results, supplement with regex search
            if (textSearchResults.length < 5) {
                const regexQuery = Listing.find({
                    ...filters,
                    $or: [
                        { title: { $regex: escapedSearchTerm, $options: 'i' } },
                        { description: { $regex: escapedSearchTerm, $options: 'i' } },
                        { category: { $regex: escapedSearchTerm, $options: 'i' } }
                    ]
                })
                .populate('seller', 'first_name last_name phone email')
                .sort({ createdAt: -1 })
                .limit(100); // Limit initial results
                
                regexSearchResults = await regexQuery.exec();
            }
            
            // Combine results, prioritizing text search results
            const combinedResults = [...textSearchResults];
            
            // Add regex results that aren't already in text results
            regexSearchResults.forEach(regexResult => {
                if (!textSearchResults.find(textResult => 
                    textResult._id.toString() === regexResult._id.toString())) {
                    combinedResults.push(regexResult);
                }
            });
            
            // Apply pagination to combined results
            const startIndex = skip;
            const endIndex = skip + limitNum;
            const listings = transformListingsWithImageUrls(combinedResults.slice(startIndex, endIndex));
            
            // Get total count
            const totalItems = combinedResults.length;
            
            // Calculate pagination info
            const totalPages = Math.ceil(totalItems / limitNum);
            const hasNext = pageNum < totalPages;
            const hasPrev = pageNum > 1;

            // Get filter metadata for frontend
            const [categories, priceRange] = await Promise.all([
                Category.find({ status: 'active' }).select('slug name listingCount'),
                Listing.aggregate([
                    { $match: { status: 'active' } },
                    { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
                ])
            ]);

            const filterMetadata = {
                categories: categories.map(cat => ({
                    slug: cat.slug,
                    name: cat.name,
                    count: cat.listingCount || 0
                })),
                priceRange: priceRange.length > 0 ? [priceRange[0].min, priceRange[0].max] : [0, 0],
                conditions: [
                    { value: 'new', label: 'New' },
                    { value: 'like-new', label: 'Like New' },
                    { value: 'good', label: 'Good' },
                    { value: 'fair', label: 'Fair' },
                    { value: 'poor', label: 'Poor' }
                ]
            };

            // Add helpful message when no results found
            let searchMessage = null;
            if (totalItems === 0) {
                searchMessage = {
                    type: 'no_results',
                    message: `No listings found for "${searchTerm}".`,
                    suggestions: [
                        'Try using different keywords',
                        'Check your spelling',
                        'Use more general terms',
                        'Remove some filters to broaden your search'
                    ]
                };
            }

            return res.json({
                success: true,
                listings,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalItems,
                    pages: totalPages,
                    hasNext,
                    hasPrev,
                    hasMore: hasNext
                },
                filters: {
                    search: searchTerm,
                    category,
                    priceMin,
                    priceMax,
                    condition,
                    location,
                    sortBy,
                    sortOrder
                },
                metadata: filterMetadata,
                searchMessage
            });
        }

        // Handle non-search queries with optimization
        const query = Listing.find(filters)
            .populate('seller', 'first_name last_name phone email marketplaceProfile.rating')
            .select('-__v') // Exclude version field
            .lean(); // Use lean for better performance
        
        // Regular sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        query.sort(sortOptions);

        // Pagination
        query.skip(skip).limit(limitNum);

        // Execute query
        const listings = await query.exec();

        // Get total count for pagination (only if needed for pagination display)
        const totalItems = await Listing.countDocuments(filters);

        // Calculate pagination info
        const totalPages = Math.ceil(totalItems / limitNum);
        const hasNext = pageNum < totalPages;
        const hasPrev = pageNum > 1;

        // Skip expensive aggregations for simple requests (like homepage)
        let filterMetadata = null;
        if (category || priceMin || priceMax || condition || location) {
            // Only fetch metadata when filters are being used
            const [categories, priceRange] = await Promise.all([
                Category.find({ status: 'active' }).select('slug name listingCount').lean(),
                Listing.aggregate([
                    { $match: { status: 'active' } },
                    { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
                ])
            ]);

            filterMetadata = {
                categories: categories.map(cat => ({
                    slug: cat.slug,
                    name: cat.name,
                    count: cat.listingCount || 0
                })),
                priceRange: priceRange.length > 0 ? [priceRange[0].min, priceRange[0].max] : [0, 0],
                conditions: [
                    { value: 'new', label: 'New' },
                    { value: 'like-new', label: 'Like New' },
                    { value: 'good', label: 'Good' },
                    { value: 'fair', label: 'Fair' },
                    { value: 'poor', label: 'Poor' }
                ]
            };
        }

        // Add helpful message when no results found with filters
        let searchMessage = null;
        if (totalItems === 0 && (category || priceMin || priceMax || condition || location)) {
            searchMessage = {
                type: 'no_results_filtered',
                message: 'No listings found matching your filters.',
                suggestions: [
                    'Try removing some filters',
                    'Expand your price range',
                    'Try a different category',
                    'Search in a broader location area'
                ]
            };
        }

        res.json({
            success: true,
            listings: transformListingsWithImageUrls(listings),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalItems,
                pages: totalPages,
                hasNext,
                hasPrev,
                hasMore: hasNext
            },
            filters: {
                category,
                priceMin,
                priceMax,
                condition,
                location,
                sortBy,
                sortOrder
            },
            ...(filterMetadata && { metadata: filterMetadata }), // Only include if fetched
            ...(searchMessage && { searchMessage }) // Only include if exists
        });

    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch listings',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get single listing by ID
// GET /api/marketplace/listings/:id
router.get("/listings/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing ID format',
                code: 'INVALID_ID'
            });
        }

        // Find listing and populate seller info
        const listing = await Listing.findById(id)
            .populate('seller', 'first_name last_name phone email');

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
                code: 'LISTING_NOT_FOUND'
            });
        }

        // Check if listing is accessible (not flagged unless user is admin or owner)
        if (listing.status === 'flagged') {
            // Only allow access if user is admin or owner
            const token = req.cookies.token;
            if (token) {
                try {
                    const jwt = await import('jsonwebtoken');
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const User = await import('../models/User.js');
                    const user = await User.default.findById(decoded.user._id);
                    
                    if (!user || (user.role !== 'admin' && listing.seller._id.toString() !== user._id.toString())) {
                        return res.status(404).json({
                            success: false,
                            message: 'Listing not found',
                            code: 'LISTING_NOT_FOUND'
                        });
                    }
                } catch (authError) {
                    return res.status(404).json({
                        success: false,
                        message: 'Listing not found',
                        code: 'LISTING_NOT_FOUND'
                    });
                }
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Listing not found',
                    code: 'LISTING_NOT_FOUND'
                });
            }
        }

        // Increment view count (don't wait for it to complete)
        listing.incrementViews().catch(err => {
            console.error('Error incrementing view count:', err);
        });

        res.json({
            success: true,
            listing: transformListingWithImageUrls(listing)
        });

    } catch (error) {
        console.error('Error fetching listing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch listing',
            error: error.message
        });
    }
});

// Get all categories with listing counts
// GET /api/marketplace/categories
router.get("/categories", async (req, res) => {
    try {
        const categories = await Category.findActive();
        
        res.json({
            success: true,
            categories
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
});

// Get listings by category
// GET /api/marketplace/categories/:category/listings
router.get("/categories/:category/listings", async (req, res) => {
    try {
        const { category } = req.params;
        const {
            page = 1,
            limit = 12,
            priceMin,
            priceMax,
            condition,
            location,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Validate category exists
        const categoryDoc = await Category.findBySlug(category);
        if (!categoryDoc) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
                code: 'CATEGORY_NOT_FOUND'
            });
        }

        // Build query filters
        const filters = { 
            status: 'active',
            category: category
        };

        // Price range filter
        if (priceMin || priceMax) {
            filters.price = {};
            if (priceMin) filters.price.$gte = parseFloat(priceMin);
            if (priceMax) filters.price.$lte = parseFloat(priceMax);
        }

        // Condition filter
        if (condition) {
            if (Array.isArray(condition)) {
                filters.condition = { $in: condition };
            } else {
                filters.condition = condition;
            }
        }

        // Location filter (case-insensitive partial match)
        if (location) {
            filters.location = { $regex: location, $options: 'i' };
        }

        // Build query with pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const [listings, totalItems] = await Promise.all([
            Listing.find(filters)
                .populate('seller', 'first_name last_name phone email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Listing.countDocuments(filters)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalItems / limitNum);
        const hasNext = pageNum < totalPages;
        const hasPrev = pageNum > 1;

        res.json({
            success: true,
            category: categoryDoc,
            listings: transformListingsWithImageUrls(listings),
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems,
                hasNext,
                hasPrev,
                limit: limitNum
            }
        });

    } catch (error) {
        console.error('Error fetching category listings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category listings',
            error: error.message
        });
    }
});

// Search autocomplete suggestions with enhanced performance and relevance
// GET /api/marketplace/search/suggestions?q=laptop
router.get("/search/suggestions", async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                success: true,
                suggestions: []
            });
        }

        const query = q.trim().toLowerCase();
        const limit = 10; // Maximum number of suggestions

        // Enhanced caching strategy - cache results for common queries
        const cacheKey = `autocomplete:${query}`;
        
        // Get suggestions from different sources with enhanced matching and performance optimization
        const [titleSuggestions, categorySuggestions, fuzzyMatches] = await Promise.all([
            // Get suggestions from listing titles and descriptions with better performance
            Listing.aggregate([
                {
                    $match: {
                        status: 'active',
                        $or: [
                            { title: { $regex: query, $options: 'i' } },
                            { description: { $regex: query, $options: 'i' } }
                        ]
                    }
                },
                {
                    $project: {
                        // Clean and split text into words with better text processing
                        words: {
                            $split: [
                                {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: {
                                                    $replaceAll: {
                                                        input: {
                                                            $toLower: {
                                                                $concat: ['$title', ' ', '$description']
                                                            }
                                                        },
                                                        find: ',',
                                                        replacement: ' '
                                                    }
                                                },
                                                find: '.',
                                                replacement: ' '
                                            }
                                        },
                                        find: '-',
                                        replacement: ' '
                                    }
                                },
                                ' '
                            ]
                        }
                    }
                },
                { $unwind: '$words' },
                {
                    $match: {
                        words: { 
                            $regex: `^${query}`, 
                            $options: 'i' 
                        },
                        // Enhanced stop words filtering
                        words: { 
                            $not: { 
                                $in: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'all', 'any', 'some', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'here', 'there', 'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'if', 'because', 'as', 'until', 'while', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'also', 'more', 'most', 'other', 'such', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'] 
                            } 
                        },
                        // Ensure minimum length and valid characters
                        $expr: { 
                            $and: [
                                { $gte: [{ $strLenCP: '$words' }, 3] },
                                { $regexMatch: { input: '$words', regex: '^[a-zA-Z0-9]+$' } }
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: '$words',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1, _id: 1 } },
                { $limit: limit }
            ]),

            // Get category suggestions with better matching
            Category.aggregate([
                {
                    $match: {
                        isActive: true,
                        $or: [
                            { name: { $regex: query, $options: 'i' } },
                            { slug: { $regex: query, $options: 'i' } },
                            { description: { $regex: query, $options: 'i' } }
                        ]
                    }
                },
                {
                    $project: {
                        suggestion: '$name',
                        type: { $literal: 'category' },
                        count: '$listingCount',
                        relevance: {
                            $cond: {
                                if: { $regexMatch: { input: { $toLower: '$name' }, regex: `^${query}` } },
                                then: 3, // Exact prefix match gets highest relevance
                                else: {
                                    $cond: {
                                        if: { $regexMatch: { input: { $toLower: '$slug' }, regex: `^${query}` } },
                                        then: 2, // Slug prefix match gets medium relevance
                                        else: 1 // Description match gets lowest relevance
                                    }
                                }
                            }
                        }
                    }
                },
                { $sort: { relevance: -1, count: -1, suggestion: 1 } },
                { $limit: 5 }
            ]),

            // Enhanced fuzzy matching with better performance
            Listing.aggregate([
                {
                    $match: {
                        status: 'active',
                        $or: [
                            { title: { $regex: `.*${query}.*`, $options: 'i' } },
                            { description: { $regex: `.*${query}.*`, $options: 'i' } }
                        ]
                    }
                },
                {
                    $project: {
                        words: {
                            $split: [
                                {
                                    $replaceAll: {
                                        input: {
                                            $replaceAll: {
                                                input: {
                                                    $toLower: {
                                                        $concat: ['$title', ' ', '$description']
                                                    }
                                                },
                                                find: ',',
                                                replacement: ' '
                                            }
                                        },
                                        find: '.',
                                        replacement: ' '
                                    }
                                },
                                ' '
                            ]
                        }
                    }
                },
                { $unwind: '$words' },
                {
                    $match: {
                        words: { 
                            $regex: `.*${query}.*`, 
                            $options: 'i' 
                        },
                        $expr: { 
                            $and: [
                                { $gte: [{ $strLenCP: '$words' }, query.length] },
                                { $regexMatch: { input: '$words', regex: '^[a-zA-Z0-9]+$' } }
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: '$words',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1, _id: 1 } },
                { $limit: 5 }
            ])
        ]);

        // Combine and format suggestions with enhanced relevance scoring
        const suggestions = [];

        // Add category suggestions first (they're usually more relevant)
        categorySuggestions.forEach(cat => {
            suggestions.push({
                text: cat.suggestion,
                type: 'category',
                count: cat.count,
                relevance: cat.relevance || 1
            });
        });

        // Add word suggestions from titles/descriptions
        titleSuggestions.forEach(word => {
            const cleanWord = word._id.trim();
            if (cleanWord.length >= 3 && 
                !suggestions.find(s => s.text.toLowerCase() === cleanWord.toLowerCase())) {
                suggestions.push({
                    text: cleanWord,
                    type: 'term',
                    count: word.count,
                    relevance: cleanWord.toLowerCase().startsWith(query) ? 2 : 1
                });
            }
        });

        // Add fuzzy matches (partial word matches)
        fuzzyMatches.forEach(word => {
            const cleanWord = word._id.trim();
            if (cleanWord.length >= query.length && 
                !suggestions.find(s => s.text.toLowerCase() === cleanWord.toLowerCase())) {
                suggestions.push({
                    text: cleanWord,
                    type: 'fuzzy',
                    count: word.count,
                    relevance: 1
                });
            }
        });

        // Enhanced sorting algorithm for better relevance
        const finalSuggestions = suggestions
            .slice(0, limit)
            .sort((a, b) => {
                // First, prioritize exact matches at the beginning
                const aExact = a.text.toLowerCase().startsWith(query);
                const bExact = b.text.toLowerCase().startsWith(query);
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                // Then by relevance score
                if (a.relevance !== b.relevance) return b.relevance - a.relevance;
                
                // Then by type priority (categories > terms > fuzzy)
                const typePriority = { category: 3, term: 2, fuzzy: 1 };
                const aPriority = typePriority[a.type] || 0;
                const bPriority = typePriority[b.type] || 0;
                if (aPriority !== bPriority) return bPriority - aPriority;
                
                // Then by count (popularity)
                if (a.count !== b.count) return b.count - a.count;
                
                // Finally by alphabetical order
                return a.text.localeCompare(b.text);
            })
            .map(s => s.text); // Return just the text for simplicity

        res.json({
            success: true,
            suggestions: finalSuggestions,
            query: q,
            count: finalSuggestions.length
        });

    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch search suggestions',
            error: error.message
        });
    }
});

// Advanced search with enhanced relevance scoring and performance
// GET /api/marketplace/search/advanced?q=laptop&boost_title=2&boost_recent=1.5
router.get("/search/advanced", async (req, res) => {
    try {
        const {
            q: search,
            page = 1,
            limit = 12,
            category,
            priceMin,
            priceMax,
            condition,
            location,
            sortBy = 'relevance',
            sortOrder = 'desc',
            boost_title = 2.0,
            boost_recent = 1.5,
            boost_category = 1.2
        } = req.query;

        if (!search || search.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters long'
            });
        }

        const searchTerm = search.trim();
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build base filters
        const baseFilters = { status: 'active' };
        if (category) baseFilters.category = category;
        if (priceMin || priceMax) {
            baseFilters.price = {};
            if (priceMin) baseFilters.price.$gte = parseFloat(priceMin);
            if (priceMax) baseFilters.price.$lte = parseFloat(priceMax);
        }
        if (condition) {
            baseFilters.condition = Array.isArray(condition) ? { $in: condition } : condition;
        }
        if (location) {
            baseFilters.location = { $regex: location, $options: 'i' };
        }

        // Advanced search with relevance scoring
        const searchResults = await Listing.aggregate([
            {
                $match: {
                    ...baseFilters,
                    $or: [
                        { title: { $regex: searchTerm, $options: 'i' } },
                        { description: { $regex: searchTerm, $options: 'i' } },
                        { category: { $regex: searchTerm, $options: 'i' } }
                    ]
                }
            },
            {
                $addFields: {
                    // Calculate relevance score with multiple factors
                    relevanceScore: {
                        $add: [
                            // Title match score (boosted)
                            {
                                $multiply: [
                                    {
                                        $cond: {
                                            if: { $regexMatch: { input: { $toLower: '$title' }, regex: searchTerm.toLowerCase() } },
                                            then: {
                                                $cond: {
                                                    if: { $regexMatch: { input: { $toLower: '$title' }, regex: `^${searchTerm.toLowerCase()}` } },
                                                    then: 10, // Exact prefix match in title
                                                    else: 5   // Partial match in title
                                                }
                                            },
                                            else: 0
                                        }
                                    },
                                    parseFloat(boost_title)
                                ]
                            },
                            // Description match score
                            {
                                $cond: {
                                    if: { $regexMatch: { input: { $toLower: '$description' }, regex: searchTerm.toLowerCase() } },
                                    then: 3,
                                    else: 0
                                }
                            },
                            // Category match score (boosted)
                            {
                                $multiply: [
                                    {
                                        $cond: {
                                            if: { $regexMatch: { input: { $toLower: '$category' }, regex: searchTerm.toLowerCase() } },
                                            then: 4,
                                            else: 0
                                        }
                                    },
                                    parseFloat(boost_category)
                                ]
                            },
                            // Recency boost (newer listings get higher scores)
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            {
                                                $subtract: [
                                                    new Date(),
                                                    '$createdAt'
                                                ]
                                            },
                                            1000 * 60 * 60 * 24 * 30 // 30 days in milliseconds
                                        ]
                                    },
                                    parseFloat(boost_recent)
                                ]
                            },
                            // View count factor (popular items get slight boost)
                            {
                                $multiply: [
                                    { $log10: { $add: ['$views', 1] } },
                                    0.5
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'seller',
                    foreignField: '_id',
                    as: 'seller',
                    pipeline: [
                        {
                            $project: {
                                first_name: 1,
                                last_name: 1,
                                phone: 1,
                                email: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: '$seller'
            },
            {
                $sort: sortBy === 'relevance' 
                    ? { relevanceScore: -1, createdAt: -1 }
                    : { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
            },
            {
                $facet: {
                    listings: [
                        { $skip: skip },
                        { $limit: limitNum }
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const listings = searchResults[0].listings;
        const totalItems = searchResults[0].totalCount[0]?.count || 0;

        // Calculate pagination info
        const totalPages = Math.ceil(totalItems / limitNum);
        const hasNext = pageNum < totalPages;
        const hasPrev = pageNum > 1;

        // Get filter metadata
        const [categories, priceRange] = await Promise.all([
            Category.findActive(),
            Listing.aggregate([
                { $match: { status: 'active' } },
                { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
            ])
        ]);

        const filterMetadata = {
            categories: categories.map(cat => ({
                slug: cat.slug,
                name: cat.name,
                count: cat.listingCount
            })),
            priceRange: priceRange.length > 0 ? [priceRange[0].min, priceRange[0].max] : [0, 0],
            conditions: [
                { value: 'new', label: 'New' },
                { value: 'like-new', label: 'Like New' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'poor', label: 'Poor' }
            ]
        };

        // Add helpful message when no results found
        let searchMessage = null;
        if (totalItems === 0) {
            searchMessage = {
                type: 'no_results',
                message: `No listings found for "${searchTerm}".`,
                suggestions: [
                    'Try using different keywords',
                    'Check your spelling',
                    'Use more general terms',
                    'Remove some filters to broaden your search',
                    'Try the basic search for broader results'
                ]
            };
        }

        res.json({
            success: true,
            listings,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems,
                hasNext,
                hasPrev,
                limit: limitNum
            },
            filters: filterMetadata,
            searchMessage,
            searchParams: {
                query: searchTerm,
                sortBy,
                boosts: {
                    title: parseFloat(boost_title),
                    recent: parseFloat(boost_recent),
                    category: parseFloat(boost_category)
                }
            }
        });

    } catch (error) {
        console.error('Error in advanced search:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform advanced search',
            error: error.message
        });
    }
});

// ============================================================================
// IMAGE SERVING ROUTES
// ============================================================================

// Serve marketplace images with caching headers
// GET /api/marketplace/images/:filename
router.get("/images/:filename", async (req, res) => {
    try {
        const { filename } = req.params;
        const { setImageCacheHeaders } = await import("../middleware/upload.js");
        
        // Set caching headers
        setImageCacheHeaders(req, res, () => {});
        
        // Serve the image file
        const imagePath = path.join(process.cwd(), 'public/assets/marketplace/images', filename);
        
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({
                success: false,
                message: 'Image not found',
                code: 'IMAGE_NOT_FOUND'
            });
        }
        
        // Send the file
        res.sendFile(imagePath);
        
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to serve image',
            error: error.message
        });
    }
});

// ============================================================================
// AUTHENTICATED USER ROUTES
// ============================================================================

// Create new listing (authenticated users only)
// POST /api/marketplace/listings
router.post("/listings", authenticateUser, async (req, res) => {
    try {
        const { 
            title, description, category, price, condition, location,
            // Rental fields
            isRental, rentalPeriod, rentalPrice, securityDeposit,
            availableFrom, availableTo, minRentalDays
        } = req.body;

        // Validate required fields
        const requiredFields = ['title', 'description', 'category', 'condition', 'location'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        // Price is required only if not rental-only
        if (!isRental && price === undefined) {
            missingFields.push('price');
        }
        
        // Rental price is required if rental enabled
        if (isRental && !rentalPrice) {
            missingFields.push('rentalPrice');
        }

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                errors: missingFields.map(field => ({
                    field,
                    message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
                }))
            });
        }

        // Validate category exists
        const categoryDoc = await Category.findBySlug(category);
        if (!categoryDoc) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category',
                errors: [{ field: 'category', message: 'Category does not exist' }]
            });
        }

        // Create new listing
        const listingData = {
            title: title.trim(),
            description: description.trim(),
            category,
            condition,
            location: location.trim(),
            seller: req.user._id,
            status: 'active'
        };

        // Add price if provided
        if (price !== undefined) {
            listingData.price = parseFloat(price);
        }

        // Add rental fields if rental enabled
        if (isRental) {
            listingData.isRental = true;
            listingData.rentalPeriod = rentalPeriod;
            listingData.rentalPrice = parseFloat(rentalPrice);
            
            if (securityDeposit) {
                listingData.securityDeposit = parseFloat(securityDeposit);
            }
            if (availableFrom) {
                listingData.availableFrom = new Date(availableFrom);
            }
            if (availableTo) {
                listingData.availableTo = new Date(availableTo);
            }
            if (minRentalDays) {
                listingData.minRentalDays = parseInt(minRentalDays);
            }
        }

        const listing = new Listing(listingData);

        // Save listing
        await listing.save();

        // Populate seller information
        await listing.populate('seller', 'first_name last_name phone email');

        // Update category listing count
        await categoryDoc.incrementListingCount();

        // Update user marketplace profile
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { 'marketplaceProfile.totalListings': 1 } }
        );

        res.status(201).json({
            success: true,
            message: 'Listing created successfully',
            listing
        });

    } catch (error) {
        console.error('Error creating listing:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message,
                value: err.value
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create listing',
            error: error.message
        });
    }
});

// Update listing (owner or admin only)
// PUT /api/marketplace/listings/:id
router.put("/listings/:id", authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, price, condition, location, status } = req.body;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing ID format',
                code: 'INVALID_ID'
            });
        }

        // Find listing
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
                code: 'LISTING_NOT_FOUND'
            });
        }

        // Check ownership (owner or admin can edit)
        if (!listing.canEdit(req.user._id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only edit your own listings.',
                code: 'ACCESS_DENIED'
            });
        }

        // Store old category for count updates
        const oldCategory = listing.category;

        // Update fields if provided
        const updates = {};
        if (title !== undefined) updates.title = title.trim();
        if (description !== undefined) updates.description = description.trim();
        if (category !== undefined) {
            // Validate new category exists
            const categoryDoc = await Category.findBySlug(category);
            if (!categoryDoc) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category',
                    errors: [{ field: 'category', message: 'Category does not exist' }]
                });
            }
            updates.category = category;
        }
        if (price !== undefined) updates.price = parseFloat(price);
        if (condition !== undefined) updates.condition = condition;
        if (location !== undefined) updates.location = location.trim();
        
        // Only allow status updates for certain transitions
        if (status !== undefined) {
            const allowedStatusTransitions = {
                'active': ['sold', 'inactive'],
                'sold': ['active'],
                'inactive': ['active'],
                'flagged': req.user.role === 'admin' ? ['active', 'inactive'] : []
            };
            
            if (!allowedStatusTransitions[listing.status]?.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot change status from ${listing.status} to ${status}`,
                    code: 'INVALID_STATUS_TRANSITION'
                });
            }
            updates.status = status;
        }

        // Update the listing (this will trigger the pre-save middleware to update updatedAt)
        Object.assign(listing, updates);
        await listing.save();

        // Update category counts if category changed
        if (updates.category && oldCategory !== updates.category) {
            await Promise.all([
                Category.findBySlug(oldCategory).then(cat => cat?.decrementListingCount()),
                Category.findBySlug(updates.category).then(cat => cat?.incrementListingCount())
            ]);
        }

        // Populate seller information
        await listing.populate('seller', 'first_name last_name phone email');

        res.json({
            success: true,
            message: 'Listing updated successfully',
            listing
        });

    } catch (error) {
        console.error('Error updating listing:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message,
                value: err.value
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update listing',
            error: error.message
        });
    }
});

// Delete listing (owner or admin only)
// DELETE /api/marketplace/listings/:id
router.delete("/listings/:id", authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing ID format',
                code: 'INVALID_ID'
            });
        }

        // Find listing
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
                code: 'LISTING_NOT_FOUND'
            });
        }

        // Check ownership (owner or admin can delete)
        if (!listing.canEdit(req.user._id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own listings.',
                code: 'ACCESS_DENIED'
            });
        }

        // Soft delete - change status to inactive (removes from public view but preserves for admin)
        listing.status = 'inactive';
        listing.updatedAt = new Date();
        await listing.save();

        // Update category listing count
        const categoryDoc = await Category.findBySlug(listing.category);
        if (categoryDoc) {
            await categoryDoc.decrementListingCount();
        }

        res.json({
            success: true,
            message: 'Listing deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete listing',
            error: error.message
        });
    }
});

// Get current user's listings
// GET /api/marketplace/my-listings
router.get("/my-listings", authenticateUser, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 12, 
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query filters
        const filters = { seller: req.user._id };
        
        // Status filter (exclude flagged unless specifically requested)
        if (status) {
            filters.status = status;
        } else {
            filters.status = { $ne: 'flagged' };
        }

        // Build query with pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const [listings, totalItems] = await Promise.all([
            Listing.find(filters)
                .populate('seller', 'first_name last_name phone email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Listing.countDocuments(filters)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalItems / limitNum);
        const hasNext = pageNum < totalPages;
        const hasPrev = pageNum > 1;

        // Get status counts for user's listings
        const statusCounts = await Listing.aggregate([
            { $match: { seller: req.user._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statusSummary = {
            active: 0,
            sold: 0,
            inactive: 0,
            flagged: 0
        };

        statusCounts.forEach(item => {
            statusSummary[item._id] = item.count;
        });

        res.json({
            success: true,
            listings: transformListingsWithImageUrls(listings),
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems,
                hasNext,
                hasPrev,
                limit: limitNum
            },
            statusSummary
        });

    } catch (error) {
        console.error('Error fetching user listings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your listings',
            error: error.message
        });
    }
});

// Upload images for a listing
// POST /api/marketplace/listings/:id/images
router.post("/listings/:id/images", authenticateUser, async (req, res) => {
    const { marketplaceImageUpload, validateImageCount, handleUploadErrors, processUploadedImages, getImageUrl } = await import("../middleware/upload.js");
    
    // Apply multer middleware for multiple file upload
    marketplaceImageUpload.array('images', 8)(req, res, async (uploadError) => {
        if (uploadError) {
            return handleUploadErrors(uploadError, req, res, () => {});
        }
        
        try {
            // Validate image count
            await validateImageCount(req, res, async () => {
                const { id } = req.params;
                const uploadedFiles = req.files;
                
                if (!uploadedFiles || uploadedFiles.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'No images provided for upload',
                        code: 'NO_FILES'
                    });
                }
                
                // Get the listing (already validated in validateImageCount middleware)
                const listing = req.listing;
                
                // Process uploaded images to create multiple sizes
                const { processedResults, errors } = await processUploadedImages(uploadedFiles);
                
                if (errors.length > 0 && processedResults.length === 0) {
                    // All images failed to process
                    return res.status(400).json({
                        success: false,
                        message: 'Failed to process uploaded images',
                        code: 'IMAGE_PROCESSING_FAILED',
                        errors: errors
                    });
                }
                
                // Add successfully processed images to listing
                const newImageFilenames = processedResults.map(result => result.originalFilename);
                listing.images.push(...newImageFilenames);
                listing.updatedAt = new Date();
                
                try {
                    await listing.save();
                    
                    // Prepare response with processed image details
                    const uploadedImages = processedResults.map(result => ({
                        filename: result.originalFilename,
                        originalName: result.originalName,
                        sizes: result.processedImages,
                        urls: getImageUrl(result.originalFilename),
                        metadata: result.originalMetadata
                    }));
                    
                    // Return success response
                    const response = {
                        success: true,
                        message: `Successfully uploaded and processed ${processedResults.length} image(s)`,
                        uploadedImages,
                        totalImages: listing.images.length
                    };
                    
                    // Include processing errors if any (partial success)
                    if (errors.length > 0) {
                        response.warnings = {
                            message: `${errors.length} image(s) failed to process`,
                            errors: errors
                        };
                    }
                    
                    res.status(201).json(response);
                    
                } catch (saveError) {
                    // If saving fails, clean up processed images
                    for (const result of processedResults) {
                        try {
                            await deleteProcessedImage(result.originalFilename);
                        } catch (cleanupError) {
                            console.warn(`Could not clean up processed images for ${result.originalFilename}:`, cleanupError);
                        }
                    }
                    
                    console.error('Error saving listing with new images:', saveError);
                    res.status(500).json({
                        success: false,
                        message: 'Failed to save uploaded images to listing',
                        error: saveError.message
                    });
                }
            });
        } catch (validationError) {
            // Clean up uploaded files if validation fails
            if (req.files) {
                for (const file of req.files) {
                    try {
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    } catch (cleanupError) {
                        console.warn(`Could not clean up failed upload ${file.path}:`, cleanupError);
                    }
                }
            }
            
            // Error response already sent by validateImageCount middleware
            return;
        }
    });
});

// Delete image from listing
// DELETE /api/marketplace/listings/:id/images/:filename
router.delete("/listings/:id/images/:filename", authenticateUser, async (req, res) => {
    try {
        const { id, filename } = req.params;
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing ID format',
                code: 'INVALID_ID'
            });
        }
        
        // Find the listing
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
                code: 'LISTING_NOT_FOUND'
            });
        }
        
        // Check if user owns the listing or is admin
        if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete images from your own listings.',
                code: 'ACCESS_DENIED'
            });
        }
        
        // Check if image exists in listing
        const imageIndex = listing.images.indexOf(filename);
        if (imageIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Image not found in this listing',
                code: 'IMAGE_NOT_FOUND'
            });
        }
        
        // Remove image from listing
        listing.images.splice(imageIndex, 1);
        listing.updatedAt = new Date();
        
        try {
            await listing.save();
            
            // Delete all processed image files (thumbnail, medium, full)
            const { deleteImageFile } = await import("../middleware/upload.js");
            const fileDeleted = await deleteImageFile(filename);
            
            res.json({
                success: true,
                message: 'Image deleted successfully',
                deletedImage: filename,
                fileDeleted,
                remainingImages: listing.images.length
            });
            
        } catch (saveError) {
            console.error('Error saving listing after image deletion:', saveError);
            res.status(500).json({
                success: false,
                message: 'Failed to remove image from listing',
                error: saveError.message
            });
        }
        
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete image',
            error: error.message
        });
    }
});

// Contact seller about a listing
// POST /api/marketplace/listings/:id/contact
router.post("/listings/:id/contact", authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { message, subject } = req.body;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing ID format',
                code: 'INVALID_ID'
            });
        }

        // Validate required fields
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required',
                errors: [{ field: 'message', message: 'Message cannot be empty' }]
            });
        }

        if (message.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: 'Message is too long',
                errors: [{ field: 'message', message: 'Message must be 2000 characters or less' }]
            });
        }

        // Find listing and populate seller info
        const listing = await Listing.findById(id)
            .populate('seller', 'first_name last_name phone email');

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
                code: 'LISTING_NOT_FOUND'
            });
        }

        // Check if listing is active
        if (listing.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'This listing is no longer available for contact',
                code: 'LISTING_NOT_ACTIVE'
            });
        }

        // Prevent users from contacting themselves
        if (listing.seller._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot contact yourself about your own listing',
                code: 'SELF_CONTACT_NOT_ALLOWED'
            });
        }

        // Send contact email
        const emailResult = await emailService.sendContactMessage({
            listing: {
                _id: listing._id,
                title: listing.title,
                price: listing.price,
                category: listing.category,
                condition: listing.condition,
                location: listing.location,
                createdAt: listing.createdAt
            },
            buyer: {
                first_name: req.user.first_name,
                last_name: req.user.last_name,
                phone: req.user.phone,
                email: req.user.email
            },
            seller: {
                first_name: listing.seller.first_name,
                last_name: listing.seller.last_name,
                email: listing.seller.email
            },
            message: message.trim(),
            subject: subject?.trim()
        });

        // Log the contact attempt (for analytics/audit purposes)
        console.log(`Contact message sent for listing ${listing._id} from user ${req.user._id} to seller ${listing.seller._id}`);

        // Return success response (don't expose seller email)
        const response = {
            success: true,
            message: 'Your message has been sent to the seller successfully',
            contactInfo: {
                sellerName: `${listing.seller.first_name} ${listing.seller.last_name}`,
                sellerPhone: listing.seller.phone,
                listingTitle: listing.title
            }
        };

        // Include preview URL in development
        if (process.env.NODE_ENV === 'development' && emailResult.previewUrl) {
            response.emailPreview = emailResult.previewUrl;
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('Error sending contact message:', error);
        
        // Handle specific email service errors
        if (error.message.includes('Failed to send contact email')) {
            return res.status(503).json({
                success: false,
                message: 'Email service is currently unavailable. Please try again later or contact the seller directly.',
                code: 'EMAIL_SERVICE_ERROR'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to send contact message',
            error: error.message
        });
    }
});

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// Get all listings for admin moderation
// GET /api/marketplace/admin/listings
router.get("/admin/listings", authenticateAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            category,
            seller,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            flagged,
            startDate,
            endDate
        } = req.query;

        // Build query filters
        const filters = {};

        // Status filter (admin can see all statuses including flagged)
        if (status) {
            if (Array.isArray(status)) {
                filters.status = { $in: status };
            } else {
                filters.status = status;
            }
        }

        // Show only flagged listings if requested
        if (flagged === 'true') {
            filters.status = 'flagged';
        }

        // Category filter
        if (category) {
            filters.category = category;
        }

        // Seller filter
        if (seller) {
            if (mongoose.Types.ObjectId.isValid(seller)) {
                filters.seller = seller;
            }
        }

        // Date range filter
        if (startDate || endDate) {
            filters.createdAt = {};
            if (startDate) filters.createdAt.$gte = new Date(startDate);
            if (endDate) filters.createdAt.$lte = new Date(endDate);
        }

        // Build query with pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        let query;

        // Handle search functionality
        if (search) {
            const searchTerm = search.trim();
            
            // Use text search if available, otherwise use regex
            try {
                query = Listing.find({
                    ...filters,
                    $text: { $search: searchTerm }
                })
                .populate('seller', 'first_name last_name phone email role createdAt')
                .select({ score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
            } catch (error) {
                // Fallback to regex search
                query = Listing.find({
                    ...filters,
                    $or: [
                        { title: { $regex: searchTerm, $options: 'i' } },
                        { description: { $regex: searchTerm, $options: 'i' } }
                    ]
                })
                .populate('seller', 'first_name last_name phone email role createdAt')
                .sort(sortOptions);
            }
        } else {
            // Regular query without search
            query = Listing.find(filters)
                .populate('seller', 'first_name last_name phone email role createdAt')
                .sort(sortOptions);
        }

        // Apply pagination
        query = query.skip(skip).limit(limitNum);

        // Execute query
        const listings = await query.exec();

        // Get total count for pagination
        const totalItems = await Listing.countDocuments(search ? {
            ...filters,
            $or: [
                { title: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } }
            ]
        } : filters);

        // Calculate pagination info
        const totalPages = Math.ceil(totalItems / limitNum);
        const hasNext = pageNum < totalPages;
        const hasPrev = pageNum > 1;

        // Get status summary for admin dashboard
        const statusSummary = await Listing.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusCounts = {
            active: 0,
            sold: 0,
            inactive: 0,
            flagged: 0
        };

        statusSummary.forEach(item => {
            statusCounts[item._id] = item.count;
        });

        // Get categories for filtering
        const categories = await Category.findActive();

        res.json({
            success: true,
            listings: transformListingsWithImageUrls(listings),
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems,
                hasNext,
                hasPrev,
                limit: limitNum
            },
            statusSummary: statusCounts,
            categories: categories.map(cat => ({
                slug: cat.slug,
                name: cat.name,
                count: cat.listingCount
            })),
            filters: {
                status,
                category,
                seller,
                search,
                flagged,
                startDate,
                endDate
            }
        });

    } catch (error) {
        console.error('Error fetching admin listings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch listings for admin',
            error: error.message
        });
    }
});

// Flag listing as inappropriate
// PUT /api/marketplace/admin/listings/:id/flag
router.put("/admin/listings/:id/flag", authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, action = 'flag' } = req.body; // action can be 'flag' or 'unflag'

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing ID format',
                code: 'INVALID_ID'
            });
        }

        // Find the listing
        const listing = await Listing.findById(id).populate('seller', 'first_name last_name email');
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
                code: 'LISTING_NOT_FOUND'
            });
        }

        // Store previous state for audit log
        const previousState = {
            status: listing.status,
            updatedAt: listing.updatedAt
        };

        let newStatus;
        let actionType;
        let message;

        if (action === 'flag') {
            if (listing.status === 'flagged') {
                return res.status(400).json({
                    success: false,
                    message: 'Listing is already flagged',
                    code: 'ALREADY_FLAGGED'
                });
            }
            newStatus = 'flagged';
            actionType = 'listing_flagged';
            message = 'Listing flagged successfully';
        } else if (action === 'unflag') {
            if (listing.status !== 'flagged') {
                return res.status(400).json({
                    success: false,
                    message: 'Listing is not currently flagged',
                    code: 'NOT_FLAGGED'
                });
            }
            newStatus = 'active'; // Restore to active status
            actionType = 'listing_unflagged';
            message = 'Listing unflagged successfully';
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be "flag" or "unflag"',
                code: 'INVALID_ACTION'
            });
        }

        // Update listing status
        listing.status = newStatus;
        listing.updatedAt = new Date();
        await listing.save();

        // Update category count if flagging (remove from active count)
        if (action === 'flag') {
            const categoryDoc = await Category.findBySlug(listing.category);
            if (categoryDoc) {
                await categoryDoc.decrementListingCount();
            }
        } else if (action === 'unflag') {
            // Restore to category count if unflagging
            const categoryDoc = await Category.findBySlug(listing.category);
            if (categoryDoc) {
                await categoryDoc.incrementListingCount();
            }
        }

        // Create audit log
        const AuditLog = (await import('../models/AuditLog.js')).default;
        await AuditLog.logAction({
            admin: req.user._id,
            action: actionType,
            resourceType: 'listing',
            resourceId: listing._id,
            details: {
                previousState,
                newState: {
                    status: listing.status,
                    updatedAt: listing.updatedAt
                },
                reason: reason || `Listing ${action}ged by admin`,
                metadata: {
                    listingTitle: listing.title,
                    sellerEmail: listing.seller.email,
                    category: listing.category
                }
            },
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
        });

        // Send notification email to seller (optional - can be implemented later)
        try {
            if (action === 'flag') {
                await emailService.sendModerationNotification({
                    seller: listing.seller,
                    listing: {
                        title: listing.title,
                        id: listing._id
                    },
                    action: 'flagged',
                    reason: reason || 'Content moderation',
                    adminName: `${req.user.first_name} ${req.user.last_name}`
                });
            }
        } catch (emailError) {
            console.warn('Failed to send moderation notification email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message,
            listing: {
                id: listing._id,
                title: listing.title,
                status: listing.status,
                updatedAt: listing.updatedAt,
                seller: {
                    name: `${listing.seller.first_name} ${listing.seller.last_name}`,
                    email: listing.seller.email
                }
            },
            action: actionType,
            reason: reason || `Listing ${action}ged by admin`
        });

    } catch (error) {
        console.error('Error flagging/unflagging listing:', error);
        
        // Log failed action
        try {
            const AuditLog = (await import('../models/AuditLog.js')).default;
            await AuditLog.logAction({
                admin: req.user._id,
                action: req.body.action === 'unflag' ? 'listing_unflagged' : 'listing_flagged',
                resourceType: 'listing',
                resourceId: req.params.id,
                details: {
                    reason: req.body.reason || 'Admin moderation action',
                    metadata: {
                        error: error.message
                    }
                },
                ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                status: 'failed',
                errorMessage: error.message
            });
        } catch (auditError) {
            console.error('Failed to log audit action:', auditError);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update listing status',
            error: error.message
        });
    }
});

// Permanently delete listing (admin only)
// DELETE /api/marketplace/admin/listings/:id
router.delete("/admin/listings/:id", authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing ID format',
                code: 'INVALID_ID'
            });
        }

        // Find the listing
        const listing = await Listing.findById(id).populate('seller', 'first_name last_name email');
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
                code: 'LISTING_NOT_FOUND'
            });
        }

        // Store listing data for audit log before deletion
        const listingData = {
            id: listing._id,
            title: listing.title,
            description: listing.description,
            category: listing.category,
            price: listing.price,
            condition: listing.condition,
            location: listing.location,
            status: listing.status,
            seller: {
                id: listing.seller._id,
                name: `${listing.seller.first_name} ${listing.seller.last_name}`,
                email: listing.seller.email
            },
            images: listing.images,
            views: listing.views,
            createdAt: listing.createdAt,
            updatedAt: listing.updatedAt
        };

        // Delete all associated images
        const imageDeletionResults = [];
        if (listing.images && listing.images.length > 0) {
            for (const filename of listing.images) {
                try {
                    await deleteProcessedImage(filename);
                    imageDeletionResults.push({ filename, deleted: true });
                } catch (imageError) {
                    console.warn(`Failed to delete image ${filename}:`, imageError);
                    imageDeletionResults.push({ filename, deleted: false, error: imageError.message });
                }
            }
        }

        // Update category listing count (decrease by 1 if listing was active)
        if (listing.status === 'active') {
            const categoryDoc = await Category.findBySlug(listing.category);
            if (categoryDoc) {
                await categoryDoc.decrementListingCount();
            }
        }

        // Permanently delete the listing from database
        await Listing.findByIdAndDelete(id);

        // Create audit log
        const AuditLog = (await import('../models/AuditLog.js')).default;
        await AuditLog.logAction({
            admin: req.user._id,
            action: 'listing_deleted',
            resourceType: 'listing',
            resourceId: listing._id,
            details: {
                previousState: listingData,
                newState: null, // Permanently deleted
                reason: reason || 'Permanently deleted by admin',
                metadata: {
                    imageDeletionResults,
                    totalImagesDeleted: imageDeletionResults.filter(r => r.deleted).length,
                    permanentDeletion: true
                }
            },
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
        });

        // Send notification email to seller
        try {
            await emailService.sendModerationNotification({
                seller: listing.seller,
                listing: {
                    title: listing.title,
                    id: listing._id
                },
                action: 'deleted',
                reason: reason || 'Content policy violation',
                adminName: `${req.user.first_name} ${req.user.last_name}`,
                permanent: true
            });
        } catch (emailError) {
            console.warn('Failed to send deletion notification email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'Listing permanently deleted successfully',
            deletedListing: {
                id: listingData.id,
                title: listingData.title,
                seller: listingData.seller,
                deletedAt: new Date()
            },
            imagesDeleted: imageDeletionResults.filter(r => r.deleted).length,
            totalImages: listing.images.length,
            reason: reason || 'Permanently deleted by admin'
        });

    } catch (error) {
        console.error('Error permanently deleting listing:', error);
        
        // Log failed action
        try {
            const AuditLog = (await import('../models/AuditLog.js')).default;
            await AuditLog.logAction({
                admin: req.user._id,
                action: 'listing_deleted',
                resourceType: 'listing',
                resourceId: req.params.id,
                details: {
                    reason: req.body.reason || 'Admin permanent deletion',
                    metadata: {
                        error: error.message
                    }
                },
                ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown',
                status: 'failed',
                errorMessage: error.message
            });
        } catch (auditError) {
            console.error('Failed to log audit action:', auditError);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to permanently delete listing',
            error: error.message
        });
    }
});

// Get marketplace statistics for admin dashboard
// GET /api/marketplace/admin/stats
router.get("/admin/stats", authenticateAdmin, async (req, res) => {
    try {
        const { 
            period = '30d', // 7d, 30d, 90d, 1y, all
            startDate,
            endDate 
        } = req.query;

        // Calculate date range based on period
        let dateFilter = {};
        const now = new Date();
        
        if (period !== 'all') {
            let startDateCalc;
            switch (period) {
                case '7d':
                    startDateCalc = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDateCalc = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '90d':
                    startDateCalc = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case '1y':
                    startDateCalc = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDateCalc = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }
            dateFilter.createdAt = { $gte: startDateCalc };
        }

        // Override with custom date range if provided
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        // Get overall listing statistics
        const [
            totalListings,
            activeListings,
            soldListings,
            inactiveListings,
            flaggedListings,
            newListingsInPeriod
        ] = await Promise.all([
            Listing.countDocuments(),
            Listing.countDocuments({ status: 'active' }),
            Listing.countDocuments({ status: 'sold' }),
            Listing.countDocuments({ status: 'inactive' }),
            Listing.countDocuments({ status: 'flagged' }),
            Listing.countDocuments(dateFilter)
        ]);

        // Get category breakdown
        const categoryStats = await Listing.aggregate([
            {
                $group: {
                    _id: '$category',
                    total: { $sum: 1 },
                    active: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                        }
                    },
                    sold: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'sold'] }, 1, 0]
                        }
                    },
                    flagged: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0]
                        }
                    },
                    averagePrice: { $avg: '$price' },
                    totalViews: { $sum: '$views' }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: 'slug',
                    as: 'categoryInfo'
                }
            },
            {
                $unwind: {
                    path: '$categoryInfo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    category: '$_id',
                    categoryName: '$categoryInfo.name',
                    total: 1,
                    active: 1,
                    sold: 1,
                    flagged: 1,
                    averagePrice: { $round: ['$averagePrice', 2] },
                    totalViews: 1
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Get price range statistics
        const priceStats = await Listing.aggregate([
            { $match: { status: { $ne: 'inactive' } } },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                    averagePrice: { $avg: '$price' },
                    medianPrice: { $push: '$price' }
                }
            }
        ]);

        // Calculate median price
        let medianPrice = 0;
        if (priceStats.length > 0 && priceStats[0].medianPrice.length > 0) {
            const sortedPrices = priceStats[0].medianPrice.sort((a, b) => a - b);
            const mid = Math.floor(sortedPrices.length / 2);
            medianPrice = sortedPrices.length % 2 === 0 
                ? (sortedPrices[mid - 1] + sortedPrices[mid]) / 2 
                : sortedPrices[mid];
        }

        // Get user activity statistics
        const userStats = await Listing.aggregate([
            {
                $group: {
                    _id: '$seller',
                    listingCount: { $sum: 1 },
                    activeListings: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                        }
                    },
                    soldListings: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'sold'] }, 1, 0]
                        }
                    },
                    totalViews: { $sum: '$views' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSellers: { $sum: 1 },
                    activeSellers: {
                        $sum: {
                            $cond: [{ $gt: ['$activeListings', 0] }, 1, 0]
                        }
                    },
                    averageListingsPerSeller: { $avg: '$listingCount' },
                    topSellerListings: { $max: '$listingCount' }
                }
            }
        ]);

        // Get recent activity (listings created in the last 7 days)
        const recentActivityDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentActivity = await Listing.aggregate([
            {
                $match: {
                    createdAt: { $gte: recentActivityDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get moderation statistics
        const AuditLog = (await import('../models/AuditLog.js')).default;
        const moderationStats = await AuditLog.getAuditStats({
            startDate: dateFilter.createdAt?.$gte,
            endDate: dateFilter.createdAt?.$lte
        });

        // Get top viewed listings
        const topViewedListings = await Listing.find({ status: 'active' })
            .populate('seller', 'first_name last_name')
            .sort({ views: -1 })
            .limit(10)
            .select('title category price views createdAt seller');

        // Compile response
        const stats = {
            overview: {
                totalListings,
                activeListings,
                soldListings,
                inactiveListings,
                flaggedListings,
                newListingsInPeriod,
                conversionRate: totalListings > 0 ? ((soldListings / totalListings) * 100).toFixed(2) : 0,
                flaggedRate: totalListings > 0 ? ((flaggedListings / totalListings) * 100).toFixed(2) : 0
            },
            categories: categoryStats,
            pricing: {
                minPrice: priceStats[0]?.minPrice || 0,
                maxPrice: priceStats[0]?.maxPrice || 0,
                averagePrice: priceStats[0]?.averagePrice ? Math.round(priceStats[0].averagePrice * 100) / 100 : 0,
                medianPrice: Math.round(medianPrice * 100) / 100
            },
            users: userStats[0] || {
                totalSellers: 0,
                activeSellers: 0,
                averageListingsPerSeller: 0,
                topSellerListings: 0
            },
            recentActivity,
            moderation: moderationStats,
            topViewedListings: topViewedListings.map(listing => ({
                id: listing._id,
                title: listing.title,
                category: listing.category,
                price: listing.price,
                views: listing.views,
                seller: `${listing.seller.first_name} ${listing.seller.last_name}`,
                createdAt: listing.createdAt
            })),
            period: {
                type: period,
                startDate: dateFilter.createdAt?.$gte,
                endDate: dateFilter.createdAt?.$lte || now
            }
        };

        res.json({
            success: true,
            stats,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('Error fetching admin statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marketplace statistics',
            error: error.message
        });
    }
});

// Get audit log for admin actions
// GET /api/marketplace/admin/audit-log
router.get("/admin/audit-log", authenticateAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            admin,
            action,
            resourceType,
            resourceId,
            startDate,
            endDate,
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = req.query;

        // Import AuditLog model
        const AuditLog = (await import('../models/AuditLog.js')).default;

        // Get audit logs with pagination and filtering
        const result = await AuditLog.getAuditLogs({
            page: parseInt(page),
            limit: parseInt(limit),
            admin,
            action,
            resourceType,
            resourceId,
            startDate,
            endDate,
            sortBy,
            sortOrder
        });

        // Format logs for display
        const formattedLogs = result.logs.map(log => log.toDisplayFormat());

        // Get available filter options
        const [availableActions, availableResourceTypes, availableAdmins] = await Promise.all([
            AuditLog.distinct('action'),
            AuditLog.distinct('resourceType'),
            AuditLog.aggregate([
                {
                    $group: {
                        _id: '$admin'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'adminInfo'
                    }
                },
                {
                    $unwind: '$adminInfo'
                },
                {
                    $project: {
                        _id: 1,
                        name: {
                            $concat: ['$adminInfo.first_name', ' ', '$adminInfo.last_name']
                        },
                        email: '$adminInfo.email'
                    }
                },
                { $sort: { name: 1 } }
            ])
        ]);

        // Get audit statistics for the current filter
        const auditStats = await AuditLog.getAuditStats({
            startDate,
            endDate,
            admin
        });

        res.json({
            success: true,
            logs: formattedLogs,
            pagination: result.pagination,
            statistics: auditStats,
            filterOptions: {
                actions: availableActions.sort(),
                resourceTypes: availableResourceTypes.sort(),
                admins: availableAdmins
            },
            appliedFilters: {
                admin,
                action,
                resourceType,
                resourceId,
                startDate,
                endDate,
                sortBy,
                sortOrder
            }
        });

    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit log',
            error: error.message
        });
    }
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

// Marketplace-specific error handler
router.use((err, req, res, next) => {
    console.error("Marketplace route error:", err);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: Object.values(err.errors).map(e => ({
                field: e.path,
                message: e.message,
                value: e.value
            }))
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: "Invalid ID format",
            code: "INVALID_ID"
        });
    }
    
    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "Duplicate entry",
            code: "DUPLICATE_ENTRY"
        });
    }
    
    // Default server error
    res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "SERVER_ERROR"
    });
});

export default router;