sed -i '/import Contact from '\''\.\/pages\/Contact'\'';/a import Privacy from '\''\.\/pages\/Privacy'\'';\nimport Terms from '\''\.\/pages\/Terms'\'';' src/App.tsx
sed -i '/<Route path="\/contact" element={<Contact \/>} \/>/a \          <Route path="\/privacy" element={<Privacy \/>} \/>\n          <Route path="\/terms" element={<Terms \/>} \/>' src/App.tsx
