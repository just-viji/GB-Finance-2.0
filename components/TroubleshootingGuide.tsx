import React from 'react';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto">
        <code>{children}</code>
    </pre>
);

const TroubleshootingGuide: React.FC = () => {
    return (
        <div className="text-left bg-gray-50 p-4 rounded-md border border-gray-200 space-y-6">
            <div>
                <h3 className="font-semibold text-brand-dark mb-2">1. Check Environment Variables</h3>
                <p className="text-sm text-gray-600 mb-2">
                    Ensure your <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> are correctly set in your hosting environment. You can find these in your Supabase project dashboard under <strong>Project Settings &gt; API</strong>.
                </p>
            </div>

            <div>
                <h3 className="font-semibold text-brand-dark mb-2">2. Configure Google Authentication</h3>
                <p className="text-sm text-gray-600 mb-2">
                    For Google Sign-In to work, you must enable it in your Supabase project:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-2">
                    <li>Go to <strong>Authentication &gt; Providers</strong> and enable Google.</li>
                    <li>Add your Google Client ID and Client Secret.</li>
                    <li>
                        Make sure the <strong>Redirect URL</strong> in your Supabase settings is added to your Google Cloud Console's "Authorized redirect URIs". The URL looks like this:
                        <CodeBlock>{`https://<your-project-ref>.supabase.co/auth/v1/callback`}</CodeBlock>
                    </li>
                </ul>
            </div>

            <div>
                <h3 className="font-semibold text-brand-dark mb-2">3. Enable Row Level Security (RLS)</h3>
                <p className="text-sm text-gray-600 mb-2">
                    This is the most common issue. For security, Supabase blocks all access to your tables by default. You must create policies to allow logged-in users to access their own data.
                </p>
                <p className="text-sm text-gray-600 mb-2">
                    Go to <strong>Table Editor</strong>, select a table (e.g., <code>transactions</code>), and click the <strong>RLS Policies</strong> tab. Create new policies using these templates:
                </p>
                <h4 className="font-medium text-sm text-brand-dark mt-3 mb-1">Policy for SELECT (viewing data):</h4>
                <CodeBlock>{`-- Name: Enable read access for authenticated users
auth.uid() = user_id`}</CodeBlock>
                
                <h4 className="font-medium text-sm text-brand-dark mt-3 mb-1">Policy for INSERT (creating data):</h4>
                <CodeBlock>{`-- Name: Enable insert for authenticated users
auth.uid() = user_id`}</CodeBlock>
                
                <h4 className="font-medium text-sm text-brand-dark mt-3 mb-1">Policy for UPDATE (editing data):</h4>
                <CodeBlock>{`-- Name: Enable update for users based on user_id
auth.uid() = user_id`}</CodeBlock>

                <h4 className="font-medium text-sm text-brand-dark mt-3 mb-1">Policy for DELETE (removing data):</h4>
                <CodeBlock>{`-- Name: Enable delete for users based on user_id
auth.uid() = user_id`}</CodeBlock>
                
                <p className="text-xs text-gray-500 mt-2">
                    <strong>Note:</strong> This assumes your tables (<code>transactions</code>, <code>transaction_line_items</code>, and <code>categories</code>) have a <code>user_id</code> column that matches the user's authentication ID. You must apply these policies to all tables that users need to access.
                </p>
            </div>
        </div>
    );
};

export default TroubleshootingGuide;
