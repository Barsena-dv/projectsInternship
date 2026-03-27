const ChatLayout = ({
  sidebar,
  chat,
  details,
  showMobileSidebar,
  onToggleMobileSidebar,
  showMobileDetails,
  onToggleMobileDetails,
}) => {
  const hasDetailsPanel = Boolean(details);

  return (
    <section className="chat-shell pnf-card overflow-hidden">
      <div className="border-b px-3 py-2 md:hidden pnf-soft-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="pnf-btn-outline rounded-lg px-3 py-2 text-sm"
            onClick={onToggleMobileSidebar}
          >
            {showMobileSidebar ? 'Hide Chats' : 'Show Chats'}
          </button>

          {hasDetailsPanel ? (
            <button
              type="button"
              className="pnf-btn-outline rounded-lg px-3 py-2 text-sm"
              onClick={onToggleMobileDetails}
            >
              {showMobileDetails ? 'Hide Details' : 'Show Details'}
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={`relative grid min-h-[72dvh] ${
          hasDetailsPanel ? 'md:grid-cols-[320px_1fr_320px]' : 'md:grid-cols-[320px_1fr]'
        }`}
      >
        <div className="hidden min-h-0 md:block">{sidebar}</div>
        <div className="min-h-0">{chat}</div>
        {hasDetailsPanel ? <div className="hidden min-h-0 md:block">{details}</div> : null}

        {showMobileSidebar ? (
          <div className="absolute inset-0 z-20 md:hidden">
            <div className="absolute inset-0 bg-slate-900/30" onClick={onToggleMobileSidebar} aria-hidden="true" />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm pnf-panel shadow-xl">{sidebar}</div>
          </div>
        ) : null}

        {hasDetailsPanel && showMobileDetails ? (
          <div className="absolute inset-0 z-20 md:hidden">
            <div className="absolute inset-0 bg-slate-900/30" onClick={onToggleMobileDetails} aria-hidden="true" />
            <div className="absolute inset-y-0 right-0 w-[85%] max-w-sm pnf-panel shadow-xl">{details}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ChatLayout;
