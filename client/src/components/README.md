# Marketplace Display Components

This document describes the listing display components implemented for task 8.2.

## Components

### ImageCarousel

A responsive image carousel component with lazy loading and navigation features.

**Features:**
- Lazy loading with intersection observer
- Keyboard navigation (arrow keys)
- Touch/swipe support
- Thumbnail navigation (optional)
- Dot indicators (when thumbnails disabled)
- Auto-play functionality (optional)
- Image preloading for smooth navigation
- Error handling with fallback images
- Loading skeleton

**Props:**
- `images` (array): Array of image URLs
- `alt` (string): Alt text for images
- `showThumbnails` (boolean): Show thumbnail navigation
- `autoPlay` (boolean): Enable auto-play
- `className` (string): Additional CSS classes

**Usage:**
```jsx
<ImageCarousel
  images={['image1.jpg', 'image2.jpg']}
  alt="Product images"
  showThumbnails={true}
  autoPlay={false}
/>
```

### ListingCard (Enhanced)

An enhanced listing card component with lazy loading and improved responsiveness.

**New Features:**
- Intersection Observer for lazy loading
- Loading skeleton while images load
- Enhanced hover effects with scale animation
- Multiple images indicator
- Improved responsive design
- Better error handling

**Props:**
- `listing` (object): Listing data
- `onFavorite` (function): Favorite button handler
- `showSellerInfo` (boolean): Show seller information
- `compact` (boolean): Compact display mode

**Usage:**
```jsx
<ListingCard
  listing={listingData}
  onFavorite={(id) => console.log('Favorited:', id)}
  showSellerInfo={true}
  compact={false}
/>
```

### ListingDetail

A comprehensive listing detail component for individual listing pages.

**Features:**
- Integrated ImageCarousel for listing images
- Seller information display
- Contact seller functionality
- Owner actions (edit/delete)
- Authentication-aware UI
- Loading states and error handling
- Responsive design

**Props:**
- `listingId` (string): Listing ID for API fetch
- `listing` (object): Pre-loaded listing data (optional)
- `currentUser` (object): Current user data
- `onContactSeller` (function): Contact seller handler
- `onEdit` (function): Edit listing handler
- `onDelete` (function): Delete listing handler

**Usage:**
```jsx
<ListingDetail
  listingId="123"
  currentUser={currentUser}
  onContactSeller={(listing) => openContactModal(listing)}
  onEdit={(listing) => navigateToEdit(listing)}
  onDelete={(id) => confirmDelete(id)}
/>
```

## Design Patterns

### Lazy Loading
All components implement lazy loading using Intersection Observer API:
- Images only load when they enter the viewport
- Loading skeletons provide visual feedback
- Reduces initial page load time

### Responsive Design
Components follow existing Genie patterns:
- Mobile-first approach
- Tailwind CSS utilities
- Consistent spacing and typography
- Proper touch targets for mobile

### Error Handling
Robust error handling throughout:
- Fallback images for broken URLs
- Loading states for async operations
- User-friendly error messages
- Graceful degradation

### Performance Optimizations
- Image preloading for smooth navigation
- Debounced interactions
- Efficient re-renders with React.memo patterns
- Proper cleanup of event listeners

## Integration

These components integrate seamlessly with:
- Existing MarketplaceLayout
- Current authentication system
- Established routing patterns
- Existing API endpoints

## Testing

Components include:
- Error boundary compatibility
- Accessibility features (ARIA labels, keyboard navigation)
- Loading state handling
- Responsive behavior validation

## Future Enhancements

Potential improvements:
- Virtual scrolling for large image sets
- Progressive image loading
- Advanced caching strategies
- Animation improvements
- Additional accessibility features