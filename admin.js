import { supabase } from './supabase-client.js';

const loginForm = document.getElementById('loginForm');
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

const message = document.getElementById('message');
const adminEmail = document.getElementById('adminEmail');

const uploadForm = document.getElementById('uploadForm');
const uploadBtn = document.getElementById('uploadBtn');
const songList = document.getElementById('songList');

// Check login
async function checkLogin() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        message.textContent = error.message;
        return;
    }

    if (data.session) {
        showDashboard(data.session.user);
    }
}

// Login
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';

    if (error) {
        message.textContent = error.message;
        return;
    }

    showDashboard(data.user);
});

// Show dashboard
function showDashboard(user) {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');

    adminEmail.textContent = user.email;
    message.textContent = '';

    loadSongs();
}

// Upload song
uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = document.getElementById('songTitle').value.trim();
    const file = document.getElementById('songFile').files[0];

    if (!file || !title) {
        message.textContent = 'Please enter a song name and select an MP3.';
        return;
    }

    if (!file.name.toLowerCase().endsWith('.mp3')) {
        message.textContent = 'Please select an MP3 file.';
        return;
    }

    const maxSize = 15 * 1024 * 1024;

    if (file.size > maxSize) {
        message.textContent = 'File size must be less than 15 MB.';
        return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    message.textContent = '';

    const filePath = `${crypto.randomUUID()}.mp3`;

    try {
        // Upload MP3 to Supabase Storage
        const { error: storageError } = await supabase
            .storage
            .from('wedding-music')
            .upload(filePath, file, {
                contentType: 'audio/mpeg',
                upsert: false
            });

        if (storageError) {
            throw storageError;
        }

        // Save song information to database
        const { error: databaseError } = await supabase
            .from('songs')
            .insert({
                title: title,
                file_path: filePath
            });

        if (databaseError) {
            await supabase
                .storage
                .from('wedding-music')
                .remove([filePath]);

            throw databaseError;
        }

        message.textContent = 'Song uploaded successfully!';

        uploadForm.reset();

        await loadSongs();

    } catch (error) {
        message.textContent = error.message;
    }

    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload Song';
});

// Load songs
async function loadSongs() {
    songList.textContent = 'Loading songs...';

    const { data: songs, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        songList.textContent = error.message;
        return;
    }

    const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('current_song_id')
        .eq('id', 1)
        .single();

    if (settingsError) {
        songList.textContent = settingsError.message;
        return;
    }

    songList.replaceChildren();

    if (!songs.length) {
        songList.textContent = 'No songs uploaded yet.';
        return;
    }

    songs.forEach((song) => {
        const isCurrent = song.id === settings.current_song_id;

        const container = document.createElement('div');
        container.style.cssText =
            'border:1px solid #ddd; padding:14px; margin:12px 0; border-radius:10px;';

        const title = document.createElement('strong');
        title.textContent = song.title;

        const status = document.createElement('p');
        status.textContent = isCurrent ? 'Currently playing' : 'Not selected';

        if (isCurrent) {
            status.style.color = 'green';
        }

        const audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'none';

        const { data: publicData } = supabase
            .storage
            .from('wedding-music')
            .getPublicUrl(song.file_path);

        audio.src = publicData.publicUrl;
        audio.style.width = '100%';

        const selectButton = document.createElement('button');
        selectButton.textContent = isCurrent ? 'Selected' : 'Use This Song';
        selectButton.disabled = isCurrent;

        selectButton.addEventListener('click', () => {
            selectSong(song.id);
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Song';
        deleteButton.style.background = '#b83232';

        deleteButton.addEventListener('click', () => {
            deleteSong(song);
        });

        container.append(
            title,
            status,
            audio,
            selectButton,
            deleteButton
        );

        songList.appendChild(container);
    });
}

// Select current song
async function selectSong(songId) {
    const { error } = await supabase
        .from('site_settings')
        .update({
            current_song_id: songId,
            updated_at: new Date().toISOString()
        })
        .eq('id', 1);

    if (error) {
        message.textContent = error.message;
        return;
    }

    message.textContent = 'Wedding music changed successfully!';

    await loadSongs();
}

// Delete song
async function deleteSong(song) {
    const confirmed = confirm(
        `Are you sure you want to delete "${song.title}"?`
    );

    if (!confirmed) return;

    const { error: databaseError } = await supabase
        .from('songs')
        .delete()
        .eq('id', song.id);

    if (databaseError) {
        message.textContent = databaseError.message;
        return;
    }

    const { error: storageError } = await supabase
        .storage
        .from('wedding-music')
        .remove([song.file_path]);

    if (storageError) {
        message.textContent =
            'Song record deleted, but file cleanup failed: ' +
            storageError.message;
    } else {
        message.textContent = 'Song deleted successfully!';
    }

    await loadSongs();
}

// Logout
logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        message.textContent = error.message;
        return;
    }

    dashboardSection.classList.add('hidden');
    loginSection.classList.remove('hidden');

    loginForm.reset();
    uploadForm.reset();

    message.textContent = 'You have logged out.';
});

checkLogin();