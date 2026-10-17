# FoRent - Rental Property Management System

FoRent is a full-stack web application for managing rental properties. It connects landlords and tenants through a centralized platform where properties can be listed, browsed, applied for, and managed.

## Features

### General
- Secure authentication using JWT stored in httpOnly cookies
- Role-based access control for landlords and tenants
- Password recovery using username or email and PIN verification
- Responsive property search with keyword and filter support

### Landlord
- List, update, and delete rental properties
- Upload multiple property images
- Manage rental applications from tenants
- Approve or reject applications
- View maintenance requests submitted by tenants
- Track payment history per property

### Tenant
- Browse available properties in the marketplace
- Apply for rental with move-in date and lease term
- Track rental application status
- Submit and manage maintenance requests
- View payment history
- Terminate lease agreement

## Tech Stack

### Frontend
- React with TypeScript
- Vite
- SCSS for styling
- Font Awesome for icons
- Stripe.js for payment processing
- Deployed on Vercel

### Backend
- Node.js with Express
- PostgreSQL via Neon (production) and local PostgreSQL (development)
- JWT for authentication
- bcrypt for password hashing
- Stripe for payment webhooks
- cookie-parser for httpOnly cookie management
- Deployed on Render

## Getting Started

### How to Use
1. Visit the live application at https://forent-rental.vercel.app
2. Click Log In / Sign Up from the home page
3. Register a new account by selecting your role — either Landlord or Tenant
4. You will be asked to provide a username, password, PIN, and personal information
5. After registering, log in with your credentials

### Password Recovery
 
1. On the login page, click Forgot your password
2. Enter your username or email along with your PIN
3. Once verified, you can set a new username or password

### As a Landlord
 
**Listing a Property**
1. After logging in, open the navigation menu and go to My Properties
2. Click Add New Property from the navigation menu
3. Fill in the property details including name, address, price, category, rooms, occupancy, and amenities
4. Upload property images (optional)
5. Submit the form to publish the listing

**Managing Applications**
1. Go to Rental Applications from the navigation menu
2. Review incoming applications from tenants
3. Click Mark Approve or Mark Reject on each application
4. Approved applications will automatically update the property status to rented

**Maintenance Requests**
1. Go to Maintenance Requests to view requests submitted by your tenants
2. You can update the status of each request as it progresses

**Payment History**
1. Go to Payment History to view all payment records associated with your properties

### As a Tenant
 
**Finding a Property**
1. From the home page, click See Available Properties or scroll to the marketplace
2. Use the search bar to search by name, location, room type, or amenity
3. Use the Filters button to narrow results by price range, category, occupancy, rooms, and amenities
4. Click View Details on any property to see the full listing

**Applying for a Property**
1. From the property details page or the marketplace, click Apply Now
2. Fill in your move-in date, lease term, contact details, and an optional message
3. Submit the application and track its status under Rental Applications

**Maintenance Requests**
1. Go to My Rentals to view your current rented property
2. Click Request Maintenance to submit a new request
3. Fill in the issue title, category, priority level, and description
4. Track your requests under Maintenance Requests

**Payments**
1. Go to Payment History to view your payment records
2. Click Check Payment from My Rentals to initiate a payment via Stripe

**Terminating a Lease**
1. Go to My Rentals or View Details of your rented property
2. Click Terminate Lease
3. Provide a reason for termination and confirm
4. The property status will return to available after confirmation


## License

This project is for educational and portfolio purposes.