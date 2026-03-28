import { supabase } from './supabaseClient';

/**
 * Creează o cameră nouă în baza de date și returnează obiectul creat.
 * Folosim 'documents' ca tabelă principală pentru camere.
 */
export async function createNewRoom(title, ownerId) {
  const { data, error } = await supabase
    .from('documents')
    .insert([
      { 
        title: title, 
        owner_id: ownerId, 
        content: '// Bine ai venit! Scrie cod aici...' 
      }
    ])
    .select(); // .select() este crucial pentru a primi ID-ul generat înapoi

  if (error) {
    console.error("Eroare la crearea camerei:", error);
    return null;
  }
  
  console.log("Cameră creată cu succes!", data[0]);
  return data[0]; 
}

/**
 * Aduce toate camerele din baza de date pentru a le afișa în Dashboard.
 * Am adăugat sortare după dată pentru a vedea cele mai noi camere primele.
 */
export async function loadRooms() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false }); // Sortare cronologică

  if (error) {
    console.error("Eroare la preluarea camerelor:", error);
    return [];
  }
  
  console.log("Camere încărcate:", data.length);
  return data;
}

/**
 * (Opțional) Șterge o cameră dacă ești owner-ul ei.
 */
export async function deleteRoom(roomId) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', roomId);

  if (error) console.error("Eroare la ștergere:", error);
  return !error;
}