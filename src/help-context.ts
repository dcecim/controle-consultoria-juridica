import React from "react";

export type HelpCtx = { open: (sectionId?: string) => void; close: () => void };
export const HelpContext = React.createContext<HelpCtx>({ open: () => void 0, close: () => void 0 });
export function useHelp() { return React.useContext(HelpContext); }

