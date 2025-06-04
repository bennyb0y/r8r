# Known Bugs and Issues

This document tracks known bugs and issues in the Burrito Rater application. Please reference the issue number when fixing bugs and update this list accordingly.

## 🐛 Active Bugs

### High Priority

1. **Image Upload Path Issue** - #018
   - Description: Image paths in database and URLs are inconsistent with the required format
   - Affected areas: 
     - Database storage (storing full path instead of filename)
     - Image URL construction in web app
     - Download URL generation
   - Current behavior:
     - Database stores: "/images/1741908086664-xatuw8nflv.jpeg"
     - Should store: "1741908086664-xatuw8nflv.jpeg"
     - Web app URL prefix needs to include full path
     - Download URL needs to include full path
   - Impact: Images may not load correctly due to incorrect path construction
   - Priority: High
   - Technical details:
     - Database schema stores full path instead of just filename
     - URL construction in web app needs to be updated to handle full paths
     - Download URL generation needs to be updated to include full path
     - Affects both display and download functionality

2. **Cloudflare Turnstile CAPTCHA Styling** - #019
   - Description: CAPTCHA implementation is not using Cloudflare's default styling and images
   - Affected areas: 
     - Rating submission form
     - CAPTCHA component styling
     - CAPTCHA image assets
   - Current behavior:
     - Custom styling is being applied to the CAPTCHA
     - Not using Cloudflare's default look and feel
     - Missing default Cloudflare images and assets
   - Expected behavior:
     - Should use Cloudflare's default Turnstile styling
     - Should display default Cloudflare images
     - Should match Cloudflare's standard appearance
   - Impact: 
     - Inconsistent user experience
     - May cause confusion for users familiar with Cloudflare's standard CAPTCHA
     - Could affect user trust in the security measure
   - Priority: High
   - Technical details:
     - Need to remove custom styling from CAPTCHA component
     - Need to ensure proper integration with Cloudflare's default assets
     - May require updates to Turnstile configuration
     - Affects both visual appearance and user experience

### Medium Priority

1. **Rating Form Validation** - #005
   - Description: Form validation doesn't provide clear error messages for all fields
   - Affected areas: Rating submission form
   - Steps to reproduce: Submit form with invalid data
   - Priority: Medium
   - Impact: User confusion during submission process

2. **Map Marker Clustering** - #006
   - Description: Map markers overlap in areas with many ratings
   - Affected areas: Map view
   - Steps to reproduce: View areas with multiple ratings close together
   - Priority: Medium
   - Impact: Difficulty selecting specific ratings in dense areas

## 🔄 Recently Fixed Bugs

1. **Backup System Enhancement** - #017
   - Description: Backup system lacked detailed statistics and proper timestamp formatting
   - Affected areas: Backup worker and admin interface
   - Fix: 
     - Added detailed backup statistics including row counts and sizes
     - Implemented proper timestamp formatting
     - Enhanced admin UI with detailed backup information
     - Added human-readable formatting for sizes and durations
   - Impact: Improved backup monitoring and management capabilities
   - Technical details: 
     - Added per-table statistics tracking
     - Implemented proper timestamp parsing
     - Enhanced admin UI with detailed statistics display
     - Added utility functions for formatting
   - Fixed in version: Latest

2. **Map Preview Image Integration** - #016
   - Description: Map preview lacked image support and had suboptimal layout for ratings with images
   - Affected areas: MapComponent.tsx and Rating interface
   - Fix: 
     - Added image support to InfoWindow component
     - Implemented proper image loading with CDN transformations
     - Updated layout to show image thumbnail alongside rating details
     - Added proper error handling for missing images
   - Impact: Enhanced user experience with visual context for ratings
   - Technical details: 
     - Used Cloudflare Image Transformations for optimized loading
     - Implemented responsive layout with proper image sizing
     - Added proper alt text and lazy loading for better accessibility
   - Fixed in version: Latest

3. **Console Logging of Unconfirmed Ratings** - #015
   - Description: Console logs exposed unconfirmed rating information to end users
   - Affected areas: MapComponent.tsx and app/list/page.tsx
   - Steps to reproduce: Open browser console while viewing the map or list view
   - Fix: 
     - Removed unnecessary console.log statements exposing sensitive data
     - Modified remaining logs to avoid revealing unconfirmed ratings
     - Updated both map and list components to ensure consistent security
   - Impact: Enhanced security by preventing exposure of sensitive rating data
   - Technical details: 
     - Removed logs showing unconfirmed ratings and their IDs
     - Removed logs exposing restaurant names and confirmation status
     - Simplified error logging to avoid data exposure
   - Fixed in version: Latest

4. **Search Bar Overlap** - #013
   - Description: Search bar overlapped with rating submission form on mobile devices
   - Fix: Implemented dynamic visibility control and proper z-index management
   - Impact: Improved mobile user experience with smooth transitions
   - Fixed in version: Latest

5. **Navigation Persistence** - #014
   - Description: Navigation bar disappeared in map and list views
   - Fix: Implemented fixed positioning and proper content padding
   - Impact: Consistent navigation experience across all views
   - Fixed in version: Latest

6. **Mobile Responsiveness Issues** - #001
   - Description: Various UI elements didn't display correctly on mobile devices
   - Fix: Implemented responsive design fixes across all components
   - Impact: Improved usability on mobile devices
   - Fixed in version: Latest

7. **Admin Directory Structure** - #011
   - Description: Admin interface components were scattered across multiple directories
   - Fix: Reorganized admin interface under unified `/app/admin` directory
   - Impact: Improved code organization and maintainability
   - Fixed in version: Latest

8. **Admin Real-time Updates** - #012
   - Description: Admin interface required manual refresh to see new ratings
   - Fix: Implemented automatic 30-second refresh and event-driven updates
   - Impact: Admins now see new ratings in real-time
   - Fixed in version: Latest

9. **Admin Rating Management** - #010
   - Description: Delete and bulk confirm functionality was not working correctly
   - Fix: Implemented proper DELETE endpoint and bulk confirmation endpoint in the worker.js file
   - Impact: Admins can now efficiently manage ratings
   - Fixed in version: Latest

10. **USA Location Validation** - #007
    - Description: Ratings could be submitted for locations outside the USA
    - Fix: Implemented bounding box check in the worker.js file
    - Impact: Only USA locations can be submitted
    - Fixed in version: Latest

11. **List View Sorting** - #008
    - Description: Sorting in list view was not working correctly
    - Fix: Updated the getSortedRatings function
    - Impact: Proper sorting functionality restored
    - Fixed in version: Latest

12. **Zipcode Filter** - #003
    - Description: Sorting by price/rating didn't work with zipcode filter
    - Fix: Modified sorting logic to handle zipcode filter
    - Impact: Proper filtering and sorting functionality
    - Fixed in version: Latest

## 📝 Reporting New Bugs

When reporting new bugs, please include:

1. A clear and descriptive title
2. Steps to reproduce the bug
3. Expected behavior
4. Actual behavior
5. Screenshots or videos if applicable
6. Browser/device information
7. Any additional context

Submit bug reports through GitHub issues or contact the development team directly.

## 🔍 Bug Triage Process

1. **Identification**: Bug is reported and documented
2. **Verification**: Bug is confirmed and prioritized
3. **Assignment**: Bug is assigned to a developer
4. **Resolution**: Bug is fixed and tested
5. **Closure**: Bug is marked as resolved and moved to "Recently Fixed"

## 📊 Bug Metrics

- **Open Bugs**: 2
- **Recently Fixed**: 12
- **Critical Issues**: 0
- **Average Resolution Time**: 3 days 