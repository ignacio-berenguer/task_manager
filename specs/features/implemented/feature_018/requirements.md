# Requirements Prompt for feature_018

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_018/specs.md' and './specs/features/feature_018/plan.md' in order to do that.

## Feature Brief

In all the date fields in the modals I want to be able to press a button (+/-) to quickly add days to the date in the control. There should be keyboard accelerators for the same operation (ideally + and -) when the control has the focus. Pressing Enter should close the modal accepting the changes.

## User Story

As a user, I want to quickly adjust dates in modal forms by pressing +/- buttons or keyboard shortcuts, so that I can efficiently set dates relative to the current value without manually typing them. I also want to confirm and close modals by pressing Enter for a faster workflow.

## Key Requirements

### Requirement 1: Date increment/decrement buttons

All date input fields in modals (task creation/edit, action creation/edit) should display +/- buttons next to the date control. Pressing "+" adds one day to the current date value; pressing "-" subtracts one day. If the date field is empty, pressing "+" or "-" should default to today's date.

### Requirement 2: Keyboard accelerators for date fields

When a date input field has focus, pressing the "+" key (or "=" for keyboards without numpad) should increment the date by one day, and pressing the "-" key should decrement by one day. These keyboard shortcuts must not interfere with normal date field typing.

### Requirement 3: Homogenize all date pickers

All date fields used for editing records in the application must use the same new DateInput component. Currently the app uses a mix of the custom `DatePicker` (calendar popup) and native `<input type="date">` HTML elements. All of these must be replaced with the new unified `DateInput` component that includes +/- buttons and keyboard accelerators. This ensures a consistent user experience across every modal.

### Requirement 4: Enter key to submit modal

Pressing the Enter key anywhere within a modal form should submit the form and close the modal, equivalent to clicking the save/accept button. This should not trigger if the user is in a multi-line text field (textarea).

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
