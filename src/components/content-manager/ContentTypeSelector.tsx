import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ContentType {
  uid: string
  displayName: string
  description?: string
  pluralName?: string
  fields?: Record<string, any>
}

interface ContentTypeSelectorProps {
  contentTypes: ContentType[] | undefined
  onSelect: (uid: string) => void
}

export function ContentTypeSelector({ contentTypes, onSelect }: ContentTypeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Content Type</CardTitle>
        <CardDescription>Choose a content type to manage its entries</CardDescription>
      </CardHeader>
      <CardContent>
        {Array.isArray(contentTypes) && contentTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentTypes.map((contentType) => (
              <Card
                key={contentType.uid}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelect(contentType.uid)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{contentType.displayName}</CardTitle>
                  <CardDescription>
                    {contentType.description || contentType.pluralName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {contentType.fields ? Object.keys(contentType.fields).length : 0} fields
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No content types found.</p>
            <p className="text-muted-foreground">Create content types in the Content Type Builder first.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
