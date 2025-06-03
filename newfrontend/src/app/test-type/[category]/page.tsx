import ClientSubTestTypePage from './client-page';

// This is a server component that handles params properly
export default function SubTestTypePage({ params }: { params: { category: string } }) {
  // Extract the category from params
  const category = params.category;
  
  // Pass the category to the client component
  return <ClientSubTestTypePage category={category} />;
}
