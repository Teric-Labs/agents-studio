import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';


/** Use instead of plain `useDispatch` for full type safety */
export const useAppDispatch: () => AppDispatch = useDispatch;

/** Use instead of plain `useSelector` for full type safety */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
