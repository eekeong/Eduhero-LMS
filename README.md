# EduHero LMS

A fast, simple, and scalable Learning Management System built for tuition centers. 
This project uses a Zero-Setup architecture (Vanilla JavaScript + Tailwind CSS) which allows you to run the entire application locally by simply opening the `index.html` file in your browser, without needing to install Node.js, databases, or run any build processes.

## Features

*   **Role-Based Access Control**: Strict separation between Admin, Teacher, and Student roles.
*   **Admin Dashboard**: Manage users, bulk import users via CSV, manage subjects, and monitor all platform videos.
*   **Teacher Dashboard**: Manage assigned subjects, easily embed YouTube/Vimeo links (automatically converted), and manage video content.
*   **Student Dashboard**: Distraction-free learning environment showing only assigned subjects. Videos are securely embedded to prevent easy link copying.
*   **Responsive Design**: fully functional on desktop, tablet, and mobile.
*   **Zero Setup**: Uses `localStorage` as a fast, local mock database.

## How to Run

1.  Open the `index.html` file in your preferred web browser. (You can literally double-click it!)
2.  Login using one of the demo accounts below:

### Demo Accounts

*   **Admin**: `admin@eduhero.com` (Password: `password`)
*   **Teacher**: `teacher@eduhero.com` (Password: `password`)
*   **Student**: `student@eduhero.com` (Password: `password`)

## Bulk Import CSV Format
To use the Bulk Import feature in the Admin Panel, create a CSV file with the following headers:
`Name,Email,Password,Role,AssignedSubjects`

*Example:*
```csv
Name,Email,Password,Role,AssignedSubjects
John Doe,john@eduhero.com,password123,student,"s_1,s_2"
Jane Smith,jane@eduhero.com,password123,teacher,s_1
```
*(Note: `AssignedSubjects` should use the Subject ID from the dashboard).*
