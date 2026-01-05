
import React from 'react';
import { 
  Home, 
  Book, 
  ShoppingCart, 
  Car, 
  Tv, 
  Zap, 
  HeartPulse, 
  MoreHorizontal,
  Banknote,
  TrendingUp
} from 'lucide-react';
import { Category } from './types';

export const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  [Category.HOUSING]: <Home className="w-5 h-5" />,
  [Category.EDUCATION]: <Book className="w-5 h-5" />,
  [Category.FOOD]: <ShoppingCart className="w-5 h-5" />,
  [Category.TRANSPORT]: <Car className="w-5 h-5" />,
  [Category.ENTERTAINMENT]: <Tv className="w-5 h-5" />,
  [Category.UTILITIES]: <Zap className="w-5 h-5" />,
  [Category.HEALTH]: <HeartPulse className="w-5 h-5" />,
  [Category.INCOME]: <Banknote className="w-5 h-5" />,
  [Category.INVESTMENT]: <TrendingUp className="w-5 h-5" />,
  [Category.OTHER]: <MoreHorizontal className="w-5 h-5" />,
};

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.HOUSING]: 'bg-blue-100 text-blue-600',
  [Category.EDUCATION]: 'bg-purple-100 text-purple-600',
  [Category.FOOD]: 'bg-orange-100 text-orange-600',
  [Category.TRANSPORT]: 'bg-cyan-100 text-cyan-600',
  [Category.ENTERTAINMENT]: 'bg-pink-100 text-pink-600',
  [Category.UTILITIES]: 'bg-yellow-100 text-yellow-600',
  [Category.HEALTH]: 'bg-red-100 text-red-600',
  [Category.INCOME]: 'bg-emerald-100 text-emerald-600',
  [Category.INVESTMENT]: 'bg-teal-100 text-teal-600',
  [Category.OTHER]: 'bg-slate-100 text-slate-600',
};
