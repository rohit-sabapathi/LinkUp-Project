# LinkUp - Alumni Association Platform

## Project Overview

LinkUp is a web-based platform designed to enhance alumni connectivity and engagement while supporting networking, event management, and job opportunities. This document provides step-by-step instructions to build LinkUp as per the specified requirements. The platform includes functionalities inspired by social media platforms like Threads, Twitter, and Instagram, tailored for alumni interaction. 

The project will use **React.js (no TypeScript)** with **Vite** for the frontend and **Django** for the backend. **Shadcn styling** will be used with a focus on `slate-900` and `slate-200` colors, supporting both light and dark modes (defaulting to dark mode). The backend will leverage JWT for authentication, SQLite for data storage, and Razorpay for secure donation processing.  

---

## Development Steps

### 1. **Authentication System**

#### Backend
1. Create a `User` model extending Django’s `AbstractUser` to include fields like:
   - Full name, email, profile photo, user type (`admin`, `alumni`, `student`), and other relevant details.  
2. Implement JWT authentication using Django REST Framework SimpleJWT.  
3. Expose APIs for:
   - User signup.
   - User login with JWT token generation.
   - Token refresh and logout.  

#### Frontend
1. Build React components for:
   - Signup page with fields like name, email, password, profile photo upload, and user type selection.  
   - Login page for authentication using JWT.
2. Securely store JWT in local storage or HttpOnly cookies.
3. Implement user session management and role-based redirection post-login.

---

### 2. **Homepage Inspired by Threads**

#### Backend
1. Create a `Post` model with fields for:
   - Author (foreign key to `User`), content, media attachments, likes, comments, and timestamps.
2. Implement APIs to:
   - Create, update, delete posts.
   - Fetch posts with pagination (most recent first).
   - Handle like/unlike actions.
   - Add comments to posts.  

#### Frontend
1. Develop a homepage UI similar to Threads:
   - Display a feed of posts with:
     - Author details, post content, media, like count, comment count.
   - Include buttons for liking, saving, and commenting on posts.
   - Provide an input field to create new posts with text/media.
2. Implement infinite scroll for post loading.  

---

### 3. **Role-Based Features**

#### Admin
1. Implement API endpoints for:
   - Creating and managing events.
   - Creating donation campaigns with Razorpay integration.
2. Design an admin dashboard for managing events and donations.  

#### Alumni
1. Allow alumni to:
   - Post job opportunities with links to external application pages.
   - Create posts in the feed.  

#### Students
1. Limit students to:
   - Viewing the feed.
   - Interacting with posts (like, save, comment).
   - Following users.

---

### 4. **Post Functionality Inspired by Twitter**

#### Backend
1. Extend the `Post` model to handle:
   - Saving posts by users.
   - Tracking likes and comments per post.
2. Implement APIs to:
   - Save/unsave posts.
   - Like/unlike posts.
   - Fetch comments for a post.

#### Frontend
1. Build components for:
   - Viewing posts with like, save, and comment buttons.
   - Saving posts to a "Saved Posts" section in the user profile.
   - Viewing and replying to comments.  

---

### 5. **Following and Followers**

#### Backend
1. Create a `Follow` model to track relationships between users.
2. Implement APIs to:
   - Follow/unfollow users.
   - Fetch a user's followers and following lists.  

#### Frontend
1. Add follow/unfollow buttons to user profiles.
2. Display follower and following counts on profiles.
3. Implement pages to view a user's followers and following lists.

---

### 6. **Private Messaging Inspired by Instagram**

#### Backend
1. Create a `Message` model with:
   - Sender, recipient, message content, media (optional), and timestamp.
2. Implement APIs for:
   - Sending messages.
   - Fetching message history between users.
   - Marking messages as read.

#### Frontend
1. Develop a messaging interface:
   - Display message threads in a sidebar (sorted by most recent activity).
   - Show chat history in a main pane with a text input for new messages.
2. Implement polling or long polling for new message updates. Avoid WebSockets for simplicity.

---

### 7. **Event Management**

#### Backend
1. Create models for `Event` and `EventRegistration` with fields for:
   - Title, description, date, location, organizer (admin-only), and attendees.  
2. Implement APIs for:
   - Admins to create/update/delete events.
   - Users to view and register for events.  

#### Frontend
1. Build components for:
   - Event listing and details.
   - Event registration.
   - Admin dashboard for managing events.  

---

### 8. **Donation Portal**

#### Backend
1. Integrate Razorpay to handle secure payments.
2. Implement APIs for:
   - Generating payment requests with Razorpay.
   - Verifying payment status and storing transaction details.

#### Frontend
1. Create donation campaign pages with:
   - Campaign details, goals, and a payment button linked to Razorpay checkout.
2. Show a thank-you message and receipt after successful donations.

---

### 9. **Light and Dark Mode**

1. Use Shadcn styling with `slate-900` for dark mode (default) and `slate-200` for light mode.
2. Implement a theme switcher to toggle between modes, persisting the user's preference.

---

## General Best Practices

1. **Code Modularity**: Build components and APIs in isolation before integration.
2. **Security**: Enforce secure JWT handling, input validation, and safe data storage.
3. **Performance**: Optimize API calls and frontend rendering for scalability.
4. **Testing**: Write unit tests for backend endpoints and frontend components.
5. **Version Control**: Use meaningful commit messages and maintain branches for major features.

---

## Expected Deliverables

1. Fully functional alumni platform with role-based features:
   - Admin: Event and donation management.
   - Alumni: Job posting and feed interactions.
   - Students: Networking and event participation.
2. Social feed with like, save, comment, and follow functionalities.
3. Private messaging system for one-on-one conversations.
4. Responsive design with dark/light mode toggle.
5. Secure Razorpay-powered donation system.
