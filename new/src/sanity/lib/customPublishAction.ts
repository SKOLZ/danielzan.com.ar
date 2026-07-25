import { useDocumentOperation } from "sanity";
import type {
  DocumentActionComponent,
  DocumentActionProps,
  DocumentActionDescription,
} from "sanity";

export const customPublishAction = (
  originalPublishAction: DocumentActionComponent,
): DocumentActionComponent => {
  return (props: DocumentActionProps): DocumentActionDescription | null => {
    const { patch, publish } = useDocumentOperation(props.id, props.type);
    const { published } = props;

    const originalAction = originalPublishAction(props);
    if (!originalAction) return null;

    return {
      ...originalAction,
      onHandle: () => {
        // Set firstPublished only if it doesn't already have a value
        const hasFirstPublished = Boolean(
          (props.published && (props.published as any).firstPublished) ||
          (props.draft && (props.draft as any).firstPublished),
        );

        if (!hasFirstPublished) {
          patch.execute([
            { set: { firstPublished: new Date().toISOString() } },
          ]);
        }

        publish.execute();
      },
    };
  };
};
