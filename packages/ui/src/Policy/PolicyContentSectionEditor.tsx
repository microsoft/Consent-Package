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
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  removeButton: {
    marginTop: tokens.spacingVerticalM,
    alignSelf: 'flex-end',
  },
  quillEditor: {
    height: '200px',
    marginBottom: tokens.spacingVerticalL,
  },
  previewContainer: {
    marginTop: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    minHeight: '100px',
    backgroundColor: tokens.colorSubtleBackground,
  },
  previewTitle: {
    marginBottom: tokens.spacingVerticalS,
  },
  tabPanel: {
    marginTop: tokens.spacingVerticalM,
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
          marginBottom: tokens.spacingVerticalS,
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
          <div dangerouslySetInnerHTML={{ __html: section.content }} />
        </div>
      )}

      <Button
        type="button"
        onClick={() => onRemoveSection(index)}
        appearance="subtle"
        className={styles.removeButton}
      >
        Remove Section
      </Button>
    </Card>
  );
};

export default PolicyContentSectionEditor;
