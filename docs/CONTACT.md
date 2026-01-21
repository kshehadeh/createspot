# Contact System

This document describes the contact page and its associated forms, API routes, and email templates.

## Overview

The contact system provides two ways for users to reach out:

1. **Support & Bug Reports** - For reporting issues or bugs encountered on the site
2. **Request for Exhibit** - For proposing exhibit ideas with selected submissions

## Page Structure

### Contact Page (`/contact`)

**Location:** `app/contact/page.tsx`

The contact page displays two card sections, each with a description and a call-to-action button that opens a modal form.

**Translations:** Uses the `contact` namespace in `messages/en.json` and `messages/es.json`.

## Forms

### Support Form

**Component:** `components/contact/support-form.tsx`

A modal dialog for submitting bug reports.

**Fields:**
- **Description** (required) - Textarea describing the problem
- **Page URL** (required) - URL input for the page where the issue occurred

**Behavior:**
- Opens in a modal dialog when "Report a Bug" is clicked
- Validates that both fields are filled
- On success, shows a confirmation message and closes after 2 seconds
- Uses theme-aware styling for error/success states

### Exhibit Request Form

**Component:** `components/contact/exhibit-request-form.tsx`

A modal dialog for submitting exhibit proposals.

**Fields:**
- **Exhibit Name** (required) - Text input for the exhibit title
- **Exhibit Description** (required) - Textarea describing the exhibit concept
- **Submissions** (required) - Selection of submissions to include

**Submission Selection:**
- Opens the `SubmissionBrowser` component in a separate modal
- Previously selected submissions are remembered when reopening
- Shows count of selected submissions (not individual IDs)
- Selected IDs are passed via `preselectedIds` prop

**Behavior:**
- Opens in a modal dialog when "Request an Exhibit" is clicked
- Validates all fields including at least one submission selected
- On success, shows a confirmation message and closes after 2 seconds

## Submission Browser

**Component:** `components/submission-browser.tsx`

A full-screen modal for browsing and selecting submissions.

**Features:**
- Search by text query
- Filter by category, tag, or creator
- Multi-select submissions with visual feedback
- Remembers selections via `preselectedIds` prop
- Requires search/filter before loading submissions (performance optimization)

**Props:**
```typescript
interface SubmissionBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (submissionIds: string[]) => void;
  excludeIds?: string[];      // IDs to exclude from results
  preselectedIds?: string[];  // IDs to pre-select on open
}
```

## API Routes

### Support API

**Endpoint:** `POST /api/contact/support`

**Location:** `app/api/contact/support/route.ts`

**Request Body:**
```typescript
{
  description: string;
  pageUrl: string;
  userEmail: string;
  userName: string;
}
```

**Behavior:**
1. Validates required fields
2. Sends bug report email to `karim@create.spot` (admin copy)
3. Sends confirmation email to the user
4. Returns success/error response

### Exhibit Request API

**Endpoint:** `POST /api/contact/exhibit-request`

**Location:** `app/api/contact/exhibit-request/route.ts`

**Request Body:**
```typescript
{
  exhibitName: string;
  exhibitDescription: string;
  submissionIds: string[];
  userEmail: string;
  userName: string;
}
```

**Behavior:**
1. Validates required fields
2. Fetches submission details from database (id, title, user info)
3. Sends exhibit request email to `karim@create.spot`
4. Returns success/error response

## Email Templates

### Contact Support Email

**Location:** `emails/templates/contact-support-email.tsx`

Used for both admin notification and user confirmation.

**Props:**
```typescript
interface ContactSupportEmailProps {
  userName?: string | null;
  description: string;
  pageUrl: string;
  baseUrl?: string;
  userEmail?: string;       // Only for admin copy
  isAdminCopy?: boolean;    // Changes messaging for admin vs user
}
```

**Admin Copy (`isAdminCopy: true`):**
- Subject: "Bug Report from {userName}"
- Includes reporter's name and email (mailto link)
- Includes clickable page URL
- Includes bug description

**User Copy (`isAdminCopy: false`):**
- Subject: "We received your bug report"
- Thanks the user for reporting
- Shows the bug details for reference
- Includes follow-up message

### Exhibit Request Email

**Location:** `emails/templates/exhibit-request-email.tsx`

Sent to admin when an exhibit request is submitted.

**Props:**
```typescript
interface ExhibitRequestEmailProps {
  requesterName: string;
  requesterEmail: string;
  exhibitName: string;
  exhibitDescription: string;
  submissions: Array<{
    id: string;
    title: string | null;
    user: {
      name: string | null;
      email: string;
    };
  }>;
  baseUrl?: string;
}
```

**Content:**
- Requester information (name and email with mailto link)
- Exhibit details (name and description)
- List of submissions with:
  - Clickable title linking to `/s/{id}`
  - Creator name and email

## Translations

All user-facing text is internationalized. Translation keys are in the `contact` namespace:

```
contact.title
contact.subtitle
contact.support.title
contact.support.description
contact.support.cta
contact.support.formDescription
contact.support.descriptionLabel
contact.support.descriptionPlaceholder
contact.support.urlLabel
contact.support.urlPlaceholder
contact.support.submit
contact.support.successMessage
contact.support.errorRequired
contact.support.errorSubmit
contact.exhibit.title
contact.exhibit.description
contact.exhibit.cta
contact.exhibit.formDescription
contact.exhibit.nameLabel
contact.exhibit.namePlaceholder
contact.exhibit.descriptionLabel
contact.exhibit.descriptionPlaceholder
contact.exhibit.submissionsLabel
contact.exhibit.selectSubmissions
contact.exhibit.selectedCount
contact.exhibit.submit
contact.exhibit.successMessage
contact.exhibit.errorRequired
contact.exhibit.errorNoSubmissions
contact.exhibit.errorSubmit
```

## Styling

### Theme Tokens

The forms use semantic theme tokens for consistency:

**Error States:**
```css
border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/50
```

**Success States:**
```css
border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-background/50 dark:text-green-200
```

**Info States (selection count):**
```css
border-blue-300 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-background/50 dark:text-blue-200
```

## File Structure

```
app/
  contact/
    page.tsx                              # Main contact page
  api/
    contact/
      support/route.ts                    # Bug report handler
      exhibit-request/route.ts            # Exhibit request handler

components/
  contact/
    support-form.tsx                      # Bug report form modal
    exhibit-request-form.tsx              # Exhibit request form modal
  submission-browser.tsx                  # Submission selection modal

emails/
  templates/
    contact-support-email.tsx             # Bug report emails
    exhibit-request-email.tsx             # Exhibit request email

messages/
  en.json                                 # English translations
  es.json                                 # Spanish translations
```

## Future Enhancements

Potential improvements for the contact system:

1. **GitHub Integration** - Automatically create GitHub issues from bug reports
2. **Screenshot Upload** - Allow users to attach screenshots to bug reports
3. **Rate Limiting** - Prevent spam submissions
4. **Admin Dashboard** - View and manage contact submissions
5. **Status Updates** - Notify users when their requests are reviewed
