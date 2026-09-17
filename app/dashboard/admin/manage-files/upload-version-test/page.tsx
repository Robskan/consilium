import { Button } from "@/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {createVersionAction} from "@/lib/files/actions";

export default function TestUploadVersionPage() {
    return (
        <form
            action={createVersionAction}
        >
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="fileId">File ID</FieldLabel>
                    <Input
                        id="fileId"
                        name="fileId"
                        placeholder="1"
                        required
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="version">Version</FieldLabel>
                    <Input
                        id="version"
                        name="version"
                        placeholder="1.0.0"
                        required
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="notes">Release Notes</FieldLabel>
                    <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Add any notes..."
                        required
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="file">File</FieldLabel>
                    <Input
                        id="file"
                        name="file"
                        type="file"
                        required
                    />
                    <FieldDescription>
                        Select the file you want to upload.
                    </FieldDescription>
                </Field>

                <Button type="submit">
                    Upload
                </Button>
            </FieldGroup>
        </form>
    );
}