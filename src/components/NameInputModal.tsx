import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { GameSettings, COLOR_SCHEMES, PlayerIdentity } from '../types';
import { t, Locale } from '../i18n';

interface Props {
  isOpen: boolean;
  locale: Locale;
  accent: string;
  onSave: (identity: PlayerIdentity) => void;
  onClose: () => void;
}

export default function NameInputModal({ isOpen, locale: l, accent, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const tag = name.trim() ? `${name.trim()}#${String(Math.floor(1000 + Math.random() * 9000))}` : '';

  const handleSave = () => {
    if (!name.trim()) return;
    const finalTag = `${name.trim()}#${String(Math.floor(1000 + Math.random() * 9000))}`;
    onSave({ name: name.trim(), tag: finalTag });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl z-10"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-xl font-bold mb-6 text-zinc-100">{t('name.title', l)}</h2>

            <input
              type="text"
              maxLength={16}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              placeholder={t('name.placeholder', l)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 mb-4"
              autoFocus
            />

            {name.trim() && (
              <div className="mb-6 text-sm">
                <span className="text-zinc-500">{t('name.tag', l)}: </span>
                <span className="font-mono font-medium" style={{ color: accent }}>{tag}</span>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="w-full py-3 rounded-lg font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{ background: name.trim() ? accent : '#3f3f46' }}
            >
              {t('name.save', l)}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
