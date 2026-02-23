import "../assets/footer.css"

export const HomeComponent = () => {
    return (
        <div className="home-welcome">
            <div className="home-welcome-inner">
                <p className="home-welcome-sub">React Learning Project</p>
                <h1 className="home-welcome-title">Learning26</h1>
                <div className="home-welcome-divider"></div>
                <p className="home-welcome-desc">
                    A curated collection of React exercises — forms, API calls, state management,
                    routing, and more. Select a section from the navigation above to begin.
                </p>
            </div>
        </div>
    )
}
