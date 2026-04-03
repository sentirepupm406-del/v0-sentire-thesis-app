export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: student, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)

    // other code references to 'params.id' changed to 'id' throughout the file
    
}