import React, { useState } from 'react';
import {
  Input,
  Textarea,
  Button,
  Card,
  makeStyles,
  tokens,
  Label,
  TabList,
  Tab,
  Subtitle2,
} from '@fluentui/react-components';
import type { TabValue, TabListProps } from '@fluentui/react-components';
import type { PolicyContentSection } from '@open-source-consent/types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const useStyles = makeStyles({
  sectionCard: {
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow4,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    position: 'relative',
    paddingBottom: '100px',
  },
  removeButton: {
    width: '180px',
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
    '&:hover': {
      backgroundColor: tokens.colorPaletteRedBackground2,
      color: tokens.colorPaletteRedForeground2,
    },
  },
  quillEditor: {
    height: '200px',
  },
  editorWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalSN,
  },
  previewContainer: {
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    border: 'none',
    boxShadow: 'none',
    borderRadius: tokens.borderRadiusMedium,
    minHeight: '100px',
    backgroundColor: tokens.colorSubtleBackground,
    '& ul, & ol': {
      paddingLeft: '20px',
      margin: '8px 0',
    },
    '& li': {
      marginBottom: '4px',
    },
    '& h4, & h5, & h6': {
      marginTop: '12px',
      marginBottom: '4px',
      fontWeight: tokens.fontWeightSemibold,
    },
  },
  previewTitle: {
    marginBottom: tokens.spacingVerticalSN,
  },
  tabPanel: {
    marginTop: tokens.spacingVerticalM,
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    position: 'absolute',
    bottom: '20px',
    left: '0',
    right: '0',
  },
});

interface PolicyContentSectionEditorProps {
  section: PolicyContentSection;
  index: number;
  onUpdateSection(
    index: number,
    field: keyof PolicyContentSection,
    value: string,
  ): void;
  onRemoveSection(index: number): void;
  quillModules?: Record<string, unknown>;
  quillFormats?: string[];
}

const PolicyContentSectionEditor: React.FC<PolicyContentSectionEditorProps> = ({
  section,
  index,
  onUpdateSection,
  onRemoveSection,
  quillModules,
  quillFormats,
}) => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<TabValue>('edit');

  const defaultQuillModules = {
    toolbar: [
      [{ header: '1' }, { header: '2' }, { font: [] }],
      [{ size: [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [
        { list: 'ordered' },
        { list: 'bullet' },
        { indent: '-1' },
        { indent: '+1' },
      ],
      ['link', 'image', 'video'],
      ['clean'],
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  const defaultQuillFormats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'video',
  ];

  const handleTabSelect: TabListProps['onTabSelect'] = (
    _event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    data: { value: TabValue },
  ) => {
    setSelectedTab(data.value);
  };

  return (
    <Card className={styles.sectionCard}>
      <Input
        placeholder="Section Title"
        value={section.title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onUpdateSection(index, 'title', e.target.value)
        }
        required
      />
      <Textarea
        placeholder="Section Description"
        value={section.description}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onUpdateSection(index, 'description', e.target.value)
        }
        required
      />
      <TabList
        selectedValue={selectedTab}
        onTabSelect={handleTabSelect}
        style={{
          marginTop: tokens.spacingVerticalM,
          marginBottom: tokens.spacingVerticalSN,
        }}
      >
        <Tab
          value="edit"
          id={`section-${index}-edit-tab`}
          aria-controls={`section-${index}-edit-panel`}
        >
          Edit Content
        </Tab>
        <Tab
          value="preview"
          id={`section-${index}-preview-tab`}
          aria-controls={`section-${index}-preview-panel`}
        >
          Preview
        </Tab>
      </TabList>

      {selectedTab === 'edit' && (
        <div
          id={`section-${index}-edit-panel`}
          role="tabpanel"
          aria-labelledby={`section-${index}-edit-tab`}
          className={styles.tabPanel}
        >
          <div className={styles.editorWrapper}>
            <Label htmlFor={`content-${index}`}>Section Content (HTML)</Label>
            <ReactQuill
              id={`content-${index}`}
              theme="snow"
              value={section.content}
              onChange={(contentValue: string) => {
                onUpdateSection(index, 'content', contentValue);
              }}
              modules={quillModules || defaultQuillModules}
              formats={quillFormats || defaultQuillFormats}
              className={styles.quillEditor}
            />
          </div>
        </div>
      )}

      {selectedTab === 'preview' && (
        <div
          id={`section-${index}-preview-panel`}
          role="tabpanel"
          aria-labelledby={`section-${index}-preview-tab`}
          className={`${styles.previewContainer} ${styles.tabPanel}`}
        >
          <Subtitle2 as="h4" className={styles.previewTitle}>
            Content Preview
          </Subtitle2>
          {/* Content directly from the client-side editor */}
          <div dangerouslySetInnerHTML={{ __html: section.content }} />
        </div>
      )}

      <div className={styles.buttonContainer}>
        <Button
          type="button"
          onClick={() => onRemoveSection(index)}
          appearance="outline"
          className={styles.removeButton}
        >
          Remove Section
        </Button>
      </div>
    </Card>
  );
};

export default PolicyContentSectionEditor;
