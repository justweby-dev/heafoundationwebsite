import { useSEO } from "../hooks/useSEO";

export default function Privacy() {
  useSEO("Privacy Policy", "Privacy Policy of HEA Foundation.");

  return (
    <div className="min-h-screen pt-32 pb-24 bg-white dark:bg-zinc-950 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-50 mb-8">Privacy Policy</h1>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
          <p>Last updated: September 2026</p>
          
          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mt-8 mb-4">1. Introduction</h2>
          <p className="mb-4">
            Welcome to HEA Foundation. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
          </p>

          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mt-8 mb-4">2. The Data We Collect About You</h2>
          <p className="mb-4">
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
            <li><strong>Transaction Data</strong> includes details about donations or payments to and from you.</li>
          </ul>

          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mt-8 mb-4">3. How We Use Your Personal Data</h2>
          <p className="mb-4">
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g. processing a donation).</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mt-8 mb-4">4. Data Security</h2>
          <p className="mb-4">
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
          </p>

          <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mt-8 mb-4">5. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this privacy policy or our privacy practices, please contact us at: <br/>
            <strong>Email:</strong> heafoundationofficial@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
