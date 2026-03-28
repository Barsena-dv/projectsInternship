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
    <section className="chat-shell overflow-hidden shadow-2xl">
      <div className="border-b px-4 py-3 md:hidden border-white/5 bg-black/20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-stone-300 text-xs font-bold hover:bg-white/10 transition-all"
            onClick={onToggleMobileSidebar}
          >
            {showMobileSidebar ? 'Hide Sidebar' : 'Show Conversations'}
          </button>

          {hasDetailsPanel ? (
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-stone-300 text-xs font-bold hover:bg-white/10 transition-all"
              onClick={onToggleMobileDetails}
            >
              {showMobileDetails ? 'Hide Details' : 'Show Details'}
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={`relative grid min-h-[75dvh] ${
          hasDetailsPanel ? 'md:grid-cols-[320px_1fr_320px]' : 'md:grid-cols-[330px_1fr]'
        }`}
      >
        <div className="hidden min-h-0 md:block">{sidebar}</div>
        <div className="min-h-0 flex flex-col">{chat}</div>
        {hasDetailsPanel ? <div className="hidden min-h-0 md:block border-l border-white/5">{details}</div> : null}

        {showMobileSidebar ? (
          <div className="absolute inset-0 z-30 md:hidden animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" onClick={onToggleMobileSidebar} aria-hidden="true" />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-stone-900 border-r border-white/10 shadow-2xl pnf-sidebar-scroll overflow-y-auto">{sidebar}</div>
          </div>
        ) : null}

        {hasDetailsPanel && showMobileDetails ? (
          <div className="absolute inset-0 z-30 md:hidden animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" onClick={onToggleMobileDetails} aria-hidden="true" />
            <div className="absolute inset-y-0 right-0 w-[85%] max-w-[320px] bg-stone-900 border-l border-white/10 shadow-2xl overflow-y-auto">{details}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ChatLayout;
