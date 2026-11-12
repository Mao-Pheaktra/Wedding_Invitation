import { supabase } from './supabase-client.js';

async function loadWeddingMusic() {
  const audio = document.getElementById('weddingAudio');

  if (!audio) {
    console.error('Wedding audio element not found.');
    return;
  }

  try {
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('current_song_id')
      .eq('id', 1)
      .single();

    if (error) throw error;

    if (!settings.current_song_id) {
      console.log('No wedding song selected.');
      return;
    }

    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('title, file_path')
      .eq('id', settings.current_song_id)
      .single();

    if (songError) throw songError;

    const { data } = supabase
      .storage
      .from('wedding-music')
      .getPublicUrl(song.file_path);

    audio.src = data.publicUrl;

    console.log('Wedding music loaded:', song.title);

  } catch (error) {
    console.error('Cannot load wedding music:', error.message);
  }
}

window.weddingMusicReady = loadWeddingMusic();