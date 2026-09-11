sed -i 's/const toggleStatus = async (id: string, current: string) => {/const setStatus = async (id: string, newStatus: string) => {/' src/admin/AdminVolunteers.tsx
sed -i 's/await updateDoc(doc(db, '\''volunteers'\'', id), {/await updateDoc(doc(db, '\''volunteers'\'', id), { status: newStatus });/' src/admin/AdminVolunteers.tsx
sed -i '/status: current === '\''approved'\'' ? '\''pending'\'' : '\''approved'\''/d' src/admin/AdminVolunteers.tsx

cat << 'INNER_EOF' > temp_replace.txt
                  <td className="p-4">
                    <select
                      value={vol.status || 'pending'}
                      onChange={(e) => setStatus(vol.id, e.target.value)}
                      className={`text-xs font-medium border rounded-full px-3 py-1 outline-none cursor-pointer ${
                        vol.status === 'approved' 
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30'
                          : vol.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30'
                      }`}
                    >
                      <option value="pending" className="text-zinc-900 bg-white">Pending</option>
                      <option value="approved" className="text-zinc-900 bg-white">Approved</option>
                      <option value="rejected" className="text-zinc-900 bg-white">Rejected</option>
                    </select>
                  </td>
INNER_EOF

# Replace the old td with the button toggle
sed -i -e '/<td className="p-4">/,/<\/td>/c\' -e "$(cat temp_replace.txt | sed 's/$/\\/')" -e ' ' src/admin/AdminVolunteers.tsx
# Oops, sed -e '/pattern/,/pattern/c\' can be tricky, let's use python or perl to replace the exact block.
