import { Tooltip as TooltipPrimitive } from 'bits-ui';

export { default as Content } from './tooltip-content.svelte';
export { default as Trigger } from './tooltip-trigger.svelte';

export const Root = TooltipPrimitive.Root;
export const Provider = TooltipPrimitive.Provider;
export const Portal = TooltipPrimitive.Portal;

export { Root as Tooltip, Portal as TooltipPortal, Provider as TooltipProvider };
