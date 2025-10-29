export const RINGTONES = {
  DEFAULT: {
    id: 'lingling',
    name: 'Ling Ling',
    url: 'https://fopbpwzvhuyydtwsxkjo.supabase.co/storage/v1/object/public/awaken/Untitled%20folder/lingling.mp3',
    duration: 120,
    description: 'A gentle and pleasant wake-up melody',
  },
};

export const DEFAULT_RINGTONE_ID = 'lingling';

export function getRingtoneById(id) {
  return RINGTONES[id?.toUpperCase()] || RINGTONES.DEFAULT;
}

export function getRingtoneUrl(id) {
  const ringtone = getRingtoneById(id);
  return ringtone?.url || RINGTONES.DEFAULT.url;
}

export function getDefaultRingtone() {
  return RINGTONES.DEFAULT;
}

export function getAllRingtones() {
  return Object.values(RINGTONES);
}
