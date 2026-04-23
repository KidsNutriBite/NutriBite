/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary": "#2b9dee",
                "background-light": "#f6f7f8",
                "background-dark": "#101a22",
                "accent-orange": "#FF8C42",
                "accent-green": "#7FB069",
                // Legacy support (optional, can be phased out or mapped)
                secondary: '#10B981',
                accent: '#F59E0B',
                kids: {
                    primary: '#FF6B6B',
                    secondary: '#4ECDC4',
                    accent: '#FFE66D'
                }
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"],
                "sans": ["Plus Jakarta Sans", "sans-serif"] // Set as default sans too
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "1rem",
                "xl": "1.5rem",
                "2xl": "2rem",
                "3xl": "2.5rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
}
