# Notification System Documentation

## Overview

The Prompts app uses an automated notification system to alert users about new weekly prompts. When a new prompt is published, subscribed users receive an email notification with the prompt details and a call-to-action to start creating.

## Architecture

### Components

#### 1. **Database Schema**
- **NotificationLog Table**: Tracks all sent notifications to prevent duplicates
  - `id`: Unique identifier
  - `type`: Notification type (e.g., `NEW_PROMPT`)
  - `meta`: JSON metadata (contains `promptId` for new prompt notifications)
  - `userId`: Reference to the user who received the notification
  - `sentAt`: Timestamp of when the notification was sent
  - Indexes on `type`, `sentAt`, and `userId` for efficient queries

#### 2. **Cron Job**
- **Location**: `app/api/cron/notifications/route.ts`
- **Trigger**: Scheduled via Vercel Cron (or similar service)
- **Function**: 
  - Discovers prompts that started within the past week
  - Checks if notifications have already been sent
  - Triggers the workflow for new prompts
  - Handles authorization via `CRON_SECRET` environment variable

#### 3. **Workflow Engine**
- **Location**: `app/workflows/send-new-prompt-notification.ts`
- **Type**: Qwik workflow with step-based execution
- **Process**:
  1. Fetch prompt details by ID
  2. Fetch all subscribed users (where `emailFeatureUpdates = true`)
  3. For each user, check if notification was already sent
  4. Send email and log notification
  5. Return summary with success count and errors

#### 4. **Email Template**
- **Location**: `emails/templates/new-prompt-notification-email.tsx`
- **Framework**: React Email
- **Features**:
  - Personalized greeting with user's name
  - Displays the three-word prompt prominently
  - Localized content (English and Spanish)
  - Direct link to start creating
  - Additional "Learn More" link to prompt details
  - Responsive design with email-safe HTML

## Flow Diagram

```
Cron Job Triggered
    ↓
Find Recently Started Prompts
    ↓
For Each Prompt:
    ├─ Check if notification already sent
    │   ├─ If Yes: Skip
    │   └─ If No: Continue
    ↓
Trigger Workflow: sendNewPromptNotification
    ↓
Workflow Execution:
    ├─ Fetch Prompt Details
    ├─ Fetch Subscribed Users
    └─ For Each User:
        ├─ Check if already sent to this user
        ├─ Send Email (localized)
        └─ Log in NotificationLog
    ↓
Return Results (sentCount, errors)
```

## Key Features

### Duplicate Prevention
- **Database Check**: Before sending, the workflow queries `NotificationLog` to check if a notification with the same `promptId` and `userId` exists
- **Single Send**: Ensures each user receives exactly one notification per prompt
- **Meta Query**: Uses JSONB path queries to match on prompt ID within the metadata

### Internationalization
- **Language Support**: Emails are sent in the user's preferred language (stored in `User.language`)
- **Email Translations**: Content strings fetched from email-specific translation files
- **Supported**: English (en) and Spanish (es)
- **Strings Include**:
  - Subject line with prompt words
  - Greeting (personalized or generic)
  - Title, description, button text
  - Preview text for email clients

### User Opt-in
- Only users with `emailFeatureUpdates = true` receive notifications
- Users can disable notifications in their profile settings
- Users can change language preference to affect notification language

### Security
- **CRON_SECRET**: Cron endpoint requires authorization header with secret
- **Prevents unauthorized triggering** of the cron job
- **Error handling**: Failed emails are logged but don't stop the process

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CRON_SECRET` | Secret token for cron job authorization | Yes |
| `NEXTAUTH_URL` | Base URL for email links | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |

## Workflow Steps

### Step: fetchPrompt
- Fetches prompt by ID from database
- Returns prompt details (id, three words, week dates)
- Logs success/failure for debugging

### Step: fetchSubscribedUsers
- Queries all users with `emailFeatureUpdates: true`
- Returns basic user data (id, email, name, language)
- Optimized query with specific field selection

### Step: checkNotificationSent
- Queries `NotificationLog` with JSONB filter on `promptId`
- Returns boolean indicating if already sent
- Prevents duplicate sends to the same user

### Step: sendEmailAndLog
- Renders React Email component with localized strings
- Sends email via configured email service
- Creates `NotificationLog` entry on success
- Returns success/error status

## Localization Example

```json
{
  "email": {
    "newPromptNotification": {
      "subject": "New Prompt: {word1}, {word2}, {word3}",
      "greeting": "Hi there!",
      "greetingWithName": "Hi {name}!",
      "title": "New Prompt This Week",
      "description": "This week we're exploring...",
      "startCreatingButton": "Start Creating",
      "learnMore": "Learn more about this prompt",
      "previewText": "New Prompt: {word1}, {word2}, {word3}"
    }
  }
}
```

## Database Queries

### Check if notification was sent for a prompt
```typescript
const existing = await prisma.notificationLog.findFirst({
  where: {
    type: "NEW_PROMPT",
    userId: "user-123",
    meta: {
      path: ["promptId"],
      equals: "prompt-456",
    },
  },
});
```

### Find all notifications sent to a user
```typescript
const userNotifications = await prisma.notificationLog.findMany({
  where: { userId: "user-123" },
  orderBy: { sentAt: "desc" },
});
```

### Get notification statistics
```typescript
const stats = await prisma.notificationLog.groupBy({
  by: ["type"],
  _count: true,
});
```

## Error Handling

### Workflow Errors
- Email send failures are caught and logged
- Error details are included in the workflow response
- Failures don't prevent notifications to other users
- Original errors are preserved for debugging

### Cron Errors
- Authorization failures return 401 Unauthorized
- Processing errors return 500 Internal Server Error
- All errors are logged with context

## Future Enhancements

### Possible Improvements
1. **Notification Preferences**: Add granular control over notification types
2. **Email Analytics**: Track open rates and click-through rates
3. **Batch Processing**: Optimize large recipient lists
4. **Scheduled Delivery**: Allow users to set preferred delivery times
5. **SMS Notifications**: Add SMS as alternative channel
6. **Push Notifications**: Browser/mobile push notifications
7. **Unsubscribe Link**: Include unsubscribe link in emails for compliance

## Testing

### Manual Testing
1. Create a new prompt via admin panel
2. Ensure at least one user has `emailFeatureUpdates: true`
3. Trigger the cron endpoint:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
        https://yourdomain.com/api/cron/notifications
   ```
4. Check user's email for notification
5. Verify `NotificationLog` entry was created

### Verify Duplicate Prevention
1. Run the cron endpoint twice with same prompt
2. Confirm second run shows `already_sent` status
3. Verify only one email received

## Monitoring

### Key Metrics to Track
- Notifications sent per week
- Email delivery success rate
- Failed sends by user/reason
- User opt-in rate for notifications
- Engagement (click-through on email links)

### Logging
- All workflow steps log with `[Workflow]` prefix
- Cron job logs with `[Cron]` prefix
- Includes timestamps and contextual information
- Errors logged with full stack traces

## Troubleshooting

### Notifications not sending
1. Check `CRON_SECRET` is set correctly
2. Verify users have `emailFeatureUpdates: true`
3. Check email service configuration
4. Review logs for specific error messages
5. Ensure `NotificationLog` table exists

### Duplicate notifications
1. Check `NotificationLog` for existing entries
2. Verify JSONB query logic
3. Check for concurrent workflow executions

### Wrong language in email
1. Verify user's `language` field is correct
2. Check email translation files have all keys
3. Review `getEmailTranslations` function

## References

- [Database Documentation](./DATABASE.md)
- [Internationalization Documentation](./INTERNATIONALIZATION.md)
- Workflow Engine: Qwik Workflows
- Email Framework: React Email
