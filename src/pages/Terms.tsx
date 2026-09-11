import { useSEO } from "../hooks/useSEO";

export default function Terms() {
  useSEO("Terms of Service", "Terms of Service of HEA Foundation.");

  return (
    <div className="min-h-screen pt-32 pb-24 bg-white dark:bg-zinc-950 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-8">Terms of Service</h1>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
          <p>Last updated: September 2026</p>
          
          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mt-8 mb-4">1. Agreement to Terms</h2>
          <p className="mb-4">
            By accessing or using the HEA Foundation website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>

          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mt-8 mb-4">2. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily download one copy of the materials (information or software) on HEA Foundation's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>attempt to decompile or reverse engineer any software contained on HEA Foundation's website;</li>
            <li>remove any copyright or other proprietary notations from the materials; or</li>
            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
          </ul>

          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mt-8 mb-4">3. Disclaimer</h2>
          <p className="mb-4">
            The materials on HEA Foundation's website are provided on an 'as is' basis. HEA Foundation makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mt-8 mb-4">4. Limitations</h2>
          <p className="mb-4">
            In no event shall HEA Foundation or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on HEA Foundation's website, even if HEA Foundation or a HEA Foundation authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>

          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mt-8 mb-4">5. Governing Law</h2>
          <p className="mb-4">
            These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </div>
      </div>
    </div>
  );
}
