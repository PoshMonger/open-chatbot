import "./global.css";

export const metadata = {

    title: "Smart Parrot",
    description: "An AI-powered chatbot that answer questions about the health and longevity",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}

export default RootLayout;