# Once UI for Next.js

A thoughtfully crafted design system that eliminates complexity while maximizing flexibility.


![Once UI](public/images/cover.jpg)

# Features

Start building your Next.js app in minutes with: 
* **A robust token and style system** that simplifies customization and ensures consistency. 
* **A copy-and-paste component library** that integrates seamlessly into your project.
* **Interactive documentation** to apply your branding and set component properties.

# Demo
[demo.once-ui.com](https://demo.once-ui.com)

![Once UI](public/images/demo.png)

# Getting started
Clone the starter template from GitHub.
```bash
git clone https://github.com/once-ui-system/nextjs-starter.git
```

You can also deploy it directly to Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fonce-ui-system%2Fnextjs-starter&redirect-url=https%3A%2F%2Fonce-ui.com%2Fdocs%2F)


View the step-by-step guide at [once-ui.com/docs](https://once-ui.com/docs).

# Documentation
[once-ui.com/docs](https://once-ui.com/docs)

# Authors
Connect with us!

Lorant One: [Site](https://lorant.one), [Threads](https://www.threads.net/@lorant.one), [LinkedIn](https://www.linkedin.com/in/lorant-one/)  
Zsofia Komaromi: [Site](https://zsofia.pro), [Threads](https://www.threads.net/@zsofia_kom), [LinkedIn](https://www.linkedin.com/in/zsofiakomaromi/)

# Get involved
- Join the [Design Engineers Club](https://discord.com/invite/5EyAQ4eNdS) on Discord to connect with designers, developers and share your projects.
- Report a [bug](https://github.com/once-ui-system/nextjs-starter/issues/new?labels=bug&template=bug_report.md).
- Submit a [feature request](https://github.com/once-ui-system/nextjs-starter/issues/new?labels=feature%20request&template=feature_request.md).

# License

Distributed under the MIT License. See `LICENSE.txt` for more information.

# Sponsors

[github.com/sponsors/once-ui-system](https://github.com/sponsors/once-ui-system)

Become a sponsor and help us continue to develop and maintain this project.

# Once UI for Figma

Once UI is also available for Figma.  
Design and prototype entire products from scratch in hours. Use the same tokens and components as the Next.js design system.

Start designing: [once-ui.com/figma](https://once-ui.com/figma)

# Once UI Pro

Take your project further with Once UI Pro. Get access to complete templates, fully designed pages, and modular blocks that make building apps even faster.

Explore Pro: [once-ui.com/pro](https://once-ui.com/pro)

# Mailer - Secure Email Client

A secure, privacy-focused email client built with Next.js, Shadcn UI, and Gmail API integration.

## Key Features

- **Seamless Gmail Integration**: Connect your Gmail account and access your emails through a clean, modern interface
- **User-Specific Encryption**: All email content is encrypted with individual user keys for maximum privacy
- **Background Sync**: Emails are automatically synchronized in the background using Gmail's History API
- **Thread View**: View emails organized by thread or as individual messages
- **Modern UI**: Clean and intuitive interface built with Next.js and Shadcn UI components

## Security Features

### User-Specific Encryption

Each user gets their own unique encryption key that is used to encrypt and decrypt their email data. This ensures:

- **Data Isolation**: Even in the event of a database breach, emails can only be decrypted by the original user
- **End-to-End Security**: Email content is encrypted before being stored in the database
- **Zero-Knowledge Architecture**: The system is designed so that the application itself cannot access the content of emails without the user's specific key

### Encrypted Email Fields

The following email fields are encrypted for maximum privacy:
- Email body content
- Email subject lines
- Email snippets/previews

### Compliance Ready

This architecture helps maintain compliance with privacy regulations like GDPR and CCPA by ensuring strong data protection and user-specific access control.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/mailer.git

# Install dependencies
cd mailer
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your environment variables in .env.local

# Run the development server
npm run dev
```

## Environment Variables

Make sure to set the following environment variables:

```
DATABASE_URL=your_database_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ENCRYPTION_KEY=your_fallback_encryption_key
```

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.