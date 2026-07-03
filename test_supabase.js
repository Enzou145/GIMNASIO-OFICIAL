const url = 'https://mhipqrjxnyykrwfjquxy.supabase.co/rest/v1/pagos?select=*&limit=1';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaXBxcmp4bnl5a3J3ZmpxdXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzYwNzIsImV4cCI6MjA5MzkxMjA3Mn0.U8nEWlt2ARh7Sq0ZX_boxXQGgbkuopAJqLtJcegPh34';

fetch(url, { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } })
  .then(r => r.json())
  .then(d => console.log(d));
