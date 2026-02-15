# Modal System

This document describes the modal system architecture, focusing on the responsive BaseModal component that provides desktop dialogs and mobile-native bottom sheet drawers.

## Overview

The app uses a unified **BaseModal** component that automatically adapts its presentation based on viewport size:

- **Desktop (md+, >= 768px)**: Centered dialog modal using Radix UI Dialog
- **Mobile (< 768px)**: Bottom sheet drawer using Vaul, with full-screen height and native-like interactions

This dual-mode approach ensures modals feel native on mobile devices while maintaining traditional desktop UX.

## Architecture

### Component Structure

```
components/ui/base-modal.tsx
├── BaseModal           - Root wrapper (responsive: Dialog vs Drawer)
├── BaseModalContent    - Content container with close button
├── BaseModalHeader     - Header section (title/description area)
├── BaseModalFooter     - Footer section (action buttons)
├── BaseModalTitle      - Title component (accessibility)
├── BaseModalDescription - Description component (accessibility)
└── BaseModalScrollArea - Scrollable content wrapper

lib/hooks/
└── use-keyboard-visible.ts - Detects virtual keyboard state
```

### Dependencies

- **Radix UI Dialog** - Accessible desktop dialog primitive
- **Vaul** - Mobile drawer component with native-like gestures
- **Visual Viewport API** - Keyboard detection on mobile

## BaseModal Component

### Basic Usage

```tsx
import {
  BaseModal,
  BaseModalContent,
  BaseModalHeader,
  BaseModalTitle,
  BaseModalDescription,
  BaseModalFooter,
} from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";

function MyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BaseModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <BaseModalContent>
        <BaseModalHeader>
          <BaseModalTitle>Modal Title</BaseModalTitle>
          <BaseModalDescription>Optional description text</BaseModalDescription>
        </BaseModalHeader>
        
        <div className="px-6">
          {/* Modal body content */}
        </div>
        
        <BaseModalFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </BaseModalFooter>
      </BaseModalContent>
    </BaseModal>
  );
}
```

### Props

#### BaseModal

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | required | Controls modal visibility |
| `onOpenChange` | `(open: boolean) => void` | required | Callback when open state changes |
| `children` | `ReactNode` | required | Modal content |
| `dismissible` | `boolean` | `true` | When `false`, prevents swipe-to-dismiss on mobile |

#### BaseModalContent

Accepts all standard Radix Dialog Content props (className, children, etc.).

#### BaseModalHeader, BaseModalFooter, BaseModalScrollArea

Accept standard HTML div props (className, children, etc.).

#### BaseModalTitle, BaseModalDescription

Accept standard Radix Dialog Title/Description props.

## Mobile-Specific Behavior

### Bottom Sheet Pattern

On mobile viewports (< 768px), modals render as bottom sheets with:

1. **Full viewport height** - Drawer fills the entire screen (100dvh)
2. **Rounded top corners** - Visual indicator of bottom sheet
3. **Drag handle** - Visual affordance for swipe gesture
4. **Swipe-to-dismiss** - Natural mobile dismiss gesture
5. **Background dimming** - Overlay that darkens the background

### Keyboard-Aware Layout

When the virtual keyboard appears on mobile, the modal automatically adjusts:

- **Content height shrinks** to the visible viewport above the keyboard
- **Footer stays visible** with `pb-safe` class for safe area padding
- **Sticky header/footer** remain positioned at top/bottom

This is handled internally by the `useKeyboardVisible` hook using the Visual Viewport API.

### Preventing Dismissal

For modals with unsaved changes or active operations, set `dismissible={false}`:

```tsx
<BaseModal 
  open={isOpen} 
  onOpenChange={onClose}
  dismissible={!isSubmitting}  // Prevent dismissal during submission
>
  <BaseModalContent>
    {/* Form content */}
  </BaseModalContent>
</BaseModal>
```

**Common use cases:**
- Form submission in progress
- File upload in progress
- Critical confirmation dialogs
- Edit flows with unsaved changes

### Scrollable Content

For modals with potentially long content, use `BaseModalScrollArea`:

```tsx
<BaseModalContent>
  <BaseModalHeader>
    <BaseModalTitle>Select Collection</BaseModalTitle>
  </BaseModalHeader>
  
  <BaseModalScrollArea>
    {/* Long scrollable list */}
    {collections.map(collection => (
      <CollectionItem key={collection.id} {...collection} />
    ))}
  </BaseModalScrollArea>
  
  <BaseModalFooter>
    <Button onClick={onClose}>Close</Button>
  </BaseModalFooter>
</BaseModalContent>
```

**Features:**
- Flex-based layout that fills available space
- Touch-optimized scrolling on iOS
- Proper containment within header/footer bounds

## SSR Considerations

BaseModal handles server-side rendering safely:

1. **Defaults to desktop mode** during SSR (renders Radix Dialog)
2. **Mounted state guard** prevents Vaul from rendering server-side
3. **Hydration-safe** - no `document is not defined` errors

This is achieved by:
- Defaulting `isDesktop` state to `true`
- Tracking `mounted` state via useEffect
- Only rendering Vaul after client-side mount

## Accessibility

BaseModal inherits accessibility features from its primitives:

- **Focus trap** - Focus is trapped within the modal when open
- **Escape key** - Pressing Escape closes the modal
- **Close button** - Visible X button in top-right corner
- **Screen reader announcements** - Title and description are announced
- **Body scroll lock** - Background content is not scrollable

## Existing Modals

The following modals have been migrated to use BaseModal:

| Component | Location | Features |
|-----------|----------|----------|
| ConfirmModal | `components/confirm-modal.tsx` | Simple confirmation dialog |
| DeleteAccountModal | `components/delete-account-modal.tsx` | Two-step deletion with text input |
| ProfileImageModal | `components/profile-image-modal.tsx` | Image upload with focal point editor |
| FocalPointModal | `components/focal-point-modal.tsx` | Image focal point selection |
| CollectionSelectModal | `components/collection-select-modal.tsx` | Collection picker with create form |
| SupportFormModal | `components/contact/support-form-modal.tsx` | Support request form |
| SubmissionEditModal | `components/submission-edit-modal.tsx` | Portfolio item editor |
| UserStatsModal | `app/admin/users/user-stats-modal.tsx` | Admin user storage and works stats |
| ExhibitRequestModal | `components/contact/exhibit-request-form.tsx` | Exhibit request form with submission picker |
| CollectionCreateButton | `components/collection-create-button.tsx` | Inline create-collection form |
| CritiqueSelectionModal | `components/critique-selection-modal.tsx` | Create critique for image/text selection |
| UserWorkModal | `components/user-work-modal.tsx` | User recent work list |
| ProgressionEditor (add/edit) | `components/progression-editor.tsx` | Add/edit progression step form |

### Full-screen and media viewers (intentionally not BaseModal)

The following components use Radix Dialog directly for full-screen or near-full-screen media/UI. They are kept on raw Dialog because bottom-sheet behavior on mobile may not be desired for these use cases; migrating them would be a product/UX decision.

| Component | Location |
|-----------|----------|
| Reference image viewer | `components/submission-detail.tsx` |
| BaseLightbox | `components/base-lightbox.tsx` |
| SelectionLightbox | `components/selection-lightbox.tsx` |
| ImageLightbox | `components/image-lightbox.tsx` |
| SubmissionBrowser | `components/submission-browser.tsx` |

## useKeyboardVisible Hook

### Purpose

Detects when the virtual keyboard is visible on mobile devices, enabling responsive layout adjustments.

### Usage

```tsx
import { useKeyboardVisible } from "@/lib/hooks/use-keyboard-visible";

function MyComponent() {
  const { isKeyboardVisible, keyboardHeight, viewportHeight } = useKeyboardVisible();
  
  return (
    <div style={{ height: isKeyboardVisible ? `${viewportHeight}px` : '100dvh' }}>
      {/* Content adjusts based on keyboard state */}
    </div>
  );
}
```

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isKeyboardVisible` | `boolean` | Whether the virtual keyboard is currently visible |
| `keyboardHeight` | `number` | Height of the keyboard in pixels (0 if not visible) |
| `viewportHeight` | `number` | Current visible viewport height (from `useViewportHeight`) |
| `layoutViewportHeight` | `number` | Full layout viewport height before keyboard appeared |

### Detection Methods

The hook uses multiple signals for reliable detection:

1. **Visual Viewport API** - Primary method using `window.visualViewport`
2. **Height threshold** - Considers keyboard visible if viewport shrinks by > 150px
3. **Focus events** - Additional signals from input focus/blur events

### SSR Safety

The hook includes guards for server-side rendering:
- `typeof window !== "undefined"` checks before accessing browser APIs
- `typeof document !== "undefined"` checks before adding event listeners

## Layout Configuration

The viewport meta tag in `app/layout.tsx` must include:

```tsx
<meta 
  name="viewport" 
  content="width=device-width, initial-scale=1, interactiveWidget='resizes-content'" 
/>
```

The `interactiveWidget='resizes-content'` setting ensures Android devices properly resize the viewport when the keyboard appears, rather than overlaying content.

## Styling Patterns

### Mobile-Only Adjustments

Components can detect mobile mode using the context:

```tsx
import { useBaseModalContent } from "@/components/ui/base-modal";

function MyContent() {
  const { isDesktop } = useBaseModalContent();
  
  return (
    <div className={isDesktop ? "p-6" : "p-4 pt-16"}>
      {/* Different padding on mobile vs desktop */}
    </div>
  );
}
```

### Safe Area Padding

For content that needs to avoid device notches and home indicators:

```css
/* In globals.css */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
```

Used automatically by `BaseModalFooter` when the keyboard is visible.

## Best Practices

1. **Always use BaseModal for new modals** - Ensures consistent mobile behavior
2. **Use dismissible prop for loading states** - Prevent accidental dismissal during operations
3. **Use BaseModalScrollArea for long content** - Ensures proper mobile scrolling
4. **Keep header/footer minimal** - They remain sticky and visible during scroll
5. **Test on actual mobile devices** - Keyboard behavior varies across browsers

## Migration Guide

To migrate an existing modal to BaseModal:

### From Radix Dialog

```tsx
// Before
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription>Description</DialogDescription>
    {/* Content */}
  </DialogContent>
</Dialog>

// After
<BaseModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <BaseModalContent>
    <BaseModalHeader>
      <BaseModalTitle>Title</BaseModalTitle>
      <BaseModalDescription>Description</BaseModalDescription>
    </BaseModalHeader>
    {/* Content */}
  </BaseModalContent>
</BaseModal>
```

### From Radix AlertDialog

```tsx
// Before
<AlertDialog open={isOpen} onOpenChange={onClose}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Title</AlertDialogTitle>
      <AlertDialogDescription>Description</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Confirm</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

// After
<BaseModal open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <BaseModalContent>
    <BaseModalHeader>
      <BaseModalTitle>Title</BaseModalTitle>
      <BaseModalDescription>Description</BaseModalDescription>
    </BaseModalHeader>
    <BaseModalFooter>
      <Button variant="outline" onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </BaseModalFooter>
  </BaseModalContent>
</BaseModal>
```

### Key Changes

1. Replace `Dialog`/`AlertDialog` root with `BaseModal`
2. Replace `DialogContent`/`AlertDialogContent` with `BaseModalContent`
3. Replace `DialogTitle`/`AlertDialogTitle` with `BaseModalTitle`
4. Replace `DialogDescription`/`AlertDialogDescription` with `BaseModalDescription`
5. Wrap header content in `BaseModalHeader`
6. Use `BaseModalFooter` with `Button` components for actions
7. Use `dismissible` prop on `BaseModal` instead of `onCloseAutoFocus` etc.
