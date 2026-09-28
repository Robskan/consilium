import { Button } from "@/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {createFileAction} from "@/lib/files/actions";
import {notFound} from "next/navigation";

export default function TestUploadFilePage() {
    if (process.env.NODE_ENV === "production") { // Prevent access to this page in production
        notFound();
    }
    return (
        <form
            action={createFileAction}
        >
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="name">File name</FieldLabel>
                    <Input
                        id="name"
                        name="name"
                        placeholder="my-file"
                        required
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <Input
                        id="description"
                        name="description"
                        placeholder="A short description"
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