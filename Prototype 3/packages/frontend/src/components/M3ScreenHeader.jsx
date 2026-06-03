import React from 'react';
import { ChevronLeft } from 'lucide-react';

/**
 * M3 Expressive collapsing large top app bar
 */
export default function M3ScreenHeader({ title, subtitle, isScrolled, onBack }) {
  return (
    <header className={`m3-top-app-bar ${isScrolled ? 'm3-top-app-bar--collapsed' : ''}`}>
      <div className="m3-top-app-bar__row">
        <button type="button" className="m3-icon-button" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <span className="m3-top-app-bar__title-compact">{title}</span>
      </div>
      <div className="m3-top-app-bar__headline">
        <h1 className="m3-display-small">{title}</h1>
        {subtitle && <p className="m3-body-small m3-text-variant mt-1 font-medium">{subtitle}</p>}
      </div>
    </header>
  );
}
