# **App Name**: 3D Print Manager

## Core Features:

- Dashboard Overview: Display key metrics like total revenue, expenses, and stock levels in a clean, modern dashboard.
- Client Management: Create, list, edit, and delete clients with relevant information stored in Firestore.
- Expense Tracking: Record variable expenses like filament and accessories, impacting the overall balance.
- Filament Inventory Management: Track filament stock, automatically updating levels when quotes are confirmed.
- Quotation Tool: Calculate the price of 3D printed pieces, considering filament usage, printing time, and profit margin. Update inventory levels and register the quote in Firestore upon confirmation.
- Settings Configuration: Configure costs (electricity, machine usage), profit margins, and currency in a dedicated settings module. Settings are stored in Firestore.
- AI-Powered Cost Advisor: A tool that leverages AI to suggest optimal pricing strategies based on real-time market data, material costs, and production factors, maximizing profitability for each print job.

## Style Guidelines:

- Primary color: Slate blue (#000) to convey reliability and innovation.
- Background color: Very light gray (#474747) to provide a clean and modern backdrop.
- Accent color: Soft orange (#E59A4A) to highlight key actions and metrics, providing a touch of warmth.
- Body font: 'Inter', sans-serif, with a modern and neutral appearance, for both headlines and body text.
- Code font: 'Source Code Pro' for any code snippets or technical details displayed.
- Use a set of minimalist icons for navigation and data representation, maintaining a clean and intuitive user interface.
- Implement a responsive, dashboard-style layout with a fixed sidebar for easy navigation across modules. Forms should be simple and clear.
- Incorporate subtle transitions and loading animations to enhance the user experience and provide feedback on interactions.