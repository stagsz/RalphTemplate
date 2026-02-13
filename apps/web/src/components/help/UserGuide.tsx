/**
 * User Guide component for HazOps Assistant.
 *
 * Provides step-by-step instructions for conducting HazOps analysis.
 */

import { Modal, Tabs, Text, List, Stack, Title, Code, Alert } from '@mantine/core';
import { IconAlertCircle, IconUpload, IconAnalyze, IconReport, IconUsers } from '@tabler/icons-react';

interface UserGuideProps {
  opened: boolean;
  onClose: () => void;
}

export function UserGuide({ opened, onClose }: UserGuideProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>HazOps Assistant - User Guide</Title>}
      size="xl"
      padding="xl"
    >
      <Tabs defaultValue="getting-started">
        <Tabs.List>
          <Tabs.Tab value="getting-started" leftSection={<IconAlertCircle size={16} />}>
            Getting Started
          </Tabs.Tab>
          <Tabs.Tab value="upload" leftSection={<IconUpload size={16} />}>
            Upload Documents
          </Tabs.Tab>
          <Tabs.Tab value="analysis" leftSection={<IconAnalyze size={16} />}>
            Conduct Analysis
          </Tabs.Tab>
          <Tabs.Tab value="reports" leftSection={<IconReport size={16} />}>
            Generate Reports
          </Tabs.Tab>
          <Tabs.Tab value="collaboration" leftSection={<IconUsers size={16} />}>
            Collaboration
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="getting-started" pt="md">
          <Stack gap="md">
            <Text size="lg" fw={600}>Welcome to HazOps Assistant!</Text>
            <Text>
              HazOps Assistant is a comprehensive platform for conducting Hazard and Operability Studies (HazOps)
              in the process industry. This guide will help you get started.
            </Text>

            <Title order={4} mt="md">Quick Start Workflow</Title>
            <List type="ordered" spacing="sm">
              <List.Item>
                <Text fw={500}>Create a Project</Text>
                <Text size="sm" c="dimmed">Go to Projects → New Project. Enter a name and description.</Text>
              </List.Item>
              <List.Item>
                <Text fw={500}>Upload P&ID Documents</Text>
                <Text size="sm" c="dimmed">Navigate to the Documents tab in your project and upload your P&ID diagrams.</Text>
              </List.Item>
              <List.Item>
                <Text fw={500}>Create an Analysis Session</Text>
                <Text size="sm" c="dimmed">Once documents are processed, create a new analysis session.</Text>
              </List.Item>
              <List.Item>
                <Text fw={500}>Conduct HazOps Analysis</Text>
                <Text size="sm" c="dimmed">Define nodes, apply guide words, and document deviations.</Text>
              </List.Item>
              <List.Item>
                <Text fw={500}>Generate Reports</Text>
                <Text size="sm" c="dimmed">Export your analysis as Word, PDF, Excel, or PowerPoint documents.</Text>
              </List.Item>
            </List>

            <Alert icon={<IconAlertCircle size={16} />} title="User Roles" color="blue" mt="md">
              <List size="sm">
                <List.Item><Code>Administrator</Code> - Full system access, user management</List.Item>
                <List.Item><Code>Lead Analyst</Code> - Project management, analysis approval</List.Item>
                <List.Item><Code>Analyst</Code> - Conduct analyses, create reports</List.Item>
                <List.Item><Code>Viewer</Code> - Read-only access</List.Item>
              </List>
            </Alert>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="upload" pt="md">
          <Stack gap="md">
            <Title order={4}>How to Upload P&ID Documents</Title>

            <Alert icon={<IconAlertCircle size={16} />} title="Important: PDF Preview Limitation" color="yellow">
              PDF preview is currently not available in the viewer. PDFs are supported for upload and download,
              but you'll need to download them to view externally. For best results, convert PDFs to PNG or JPG format.
            </Alert>

            <Title order={5} mt="md">Step-by-Step Instructions</Title>
            <List type="ordered" spacing="md">
              <List.Item>
                <Stack gap="xs">
                  <Text fw={500}>Navigate to the Documents Tab</Text>
                  <Text size="sm" c="dimmed">
                    Open your project → Click the "Documents" tab in the top navigation
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap="xs">
                  <Text fw={500}>Click "Upload P&ID Document"</Text>
                  <Text size="sm" c="dimmed">
                    Look for the upload button in the top-right corner of the Documents page
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap="xs">
                  <Text fw={500}>Select Your File</Text>
                  <Text size="sm" c="dimmed">
                    Supported formats: PNG, JPG, PDF (max 50MB)
                  </Text>
                  <Text size="sm" c="dimmed" fs="italic">
                    Recommended: Use PNG or JPG for inline preview
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap="xs">
                  <Text fw={500}>Wait for Upload & Processing</Text>
                  <Text size="sm" c="dimmed">
                    Status will change: <Code>pending</Code> → <Code>processing</Code> → <Code>processed</Code>
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap="xs">
                  <Text fw={500}>Document Ready!</Text>
                  <Text size="sm" c="dimmed">
                    Once status is "processed", you can use it in analysis sessions
                  </Text>
                </Stack>
              </List.Item>
            </List>

            <Title order={5} mt="md">Troubleshooting</Title>
            <List spacing="sm">
              <List.Item>
                <Text fw={500}>Document stuck in "pending" status?</Text>
                <Text size="sm" c="dimmed">
                  Contact your administrator - processing may be disabled. Documents can be manually
                  marked as "processed" via database update.
                </Text>
              </List.Item>
              <List.Item>
                <Text fw={500}>Can't see uploaded document in analysis dropdown?</Text>
                <Text size="sm" c="dimmed">
                  Only documents with status "processed" appear in the dropdown. Check the Documents tab.
                </Text>
              </List.Item>
              <List.Item>
                <Text fw={500}>PDF shows "preview not available"?</Text>
                <Text size="sm" c="dimmed">
                  This is expected. Download the PDF or convert to PNG/JPG for inline viewing.
                </Text>
              </List.Item>
            </List>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="analysis" pt="md">
          <Stack gap="md">
            <Title order={4}>Conducting HazOps Analysis</Title>

            <Title order={5}>HazOps Methodology Overview</Title>
            <Text>
              HazOps is a structured technique for identifying potential hazards in industrial processes
              using guide words applied to process parameters.
            </Text>

            <Title order={5} mt="md">Guide Words</Title>
            <List>
              <List.Item><Code>NO</Code> - Complete negation (e.g., no flow)</List.Item>
              <List.Item><Code>MORE</Code> - Quantitative increase (e.g., more pressure)</List.Item>
              <List.Item><Code>LESS</Code> - Quantitative decrease (e.g., less temperature)</List.Item>
              <List.Item><Code>REVERSE</Code> - Opposite of intention (e.g., reverse flow)</List.Item>
              <List.Item><Code>EARLY</Code> - Timing-related early occurrence</List.Item>
              <List.Item><Code>LATE</Code> - Timing-related late occurrence</List.Item>
              <List.Item><Code>OTHER THAN</Code> - Qualitative deviation</List.Item>
            </List>

            <Title order={5} mt="md">Analysis Workflow</Title>
            <List type="ordered" spacing="sm">
              <List.Item>Select a node on the P&ID diagram</List.Item>
              <List.Item>Choose a guide word (NO, MORE, LESS, etc.)</List.Item>
              <List.Item>Describe the deviation (e.g., "No flow through pump P-101")</List.Item>
              <List.Item>Document causes (e.g., "Valve closed", "Pump failure")</List.Item>
              <List.Item>Document consequences (e.g., "Process shutdown", "Safety risk")</List.Item>
              <List.Item>List existing safeguards (e.g., "Pressure alarm", "Auto shutdown")</List.Item>
              <List.Item>Add recommendations if needed</List.Item>
              <List.Item>Assess risk (Severity × Likelihood × Detectability)</List.Item>
            </List>

            <Title order={5} mt="md">Risk Assessment</Title>
            <Text size="sm">
              Risk Score = <Code>Severity (1-5)</Code> × <Code>Likelihood (1-5)</Code> × <Code>Detectability (1-5)</Code>
            </Text>
            <List size="sm" mt="xs">
              <List.Item><Text c="green">Low Risk: 1-20</Text></List.Item>
              <List.Item><Text c="yellow">Medium Risk: 21-60</Text></List.Item>
              <List.Item><Text c="red">High Risk: 61-125</Text></List.Item>
            </List>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="reports" pt="md">
          <Stack gap="md">
            <Title order={4}>Generating Reports</Title>
            <Text>
              Export your HazOps analysis in professional formats for stakeholders and regulatory compliance.
            </Text>

            <Title order={5} mt="md">Available Formats</Title>
            <List>
              <List.Item><Text fw={500}>Word (.docx)</Text> - Detailed narrative report with tables</List.Item>
              <List.Item><Text fw={500}>PDF (.pdf)</Text> - Print-ready formatted document</List.Item>
              <List.Item><Text fw={500}>Excel (.xlsx)</Text> - Spreadsheet with all entries and data</List.Item>
              <List.Item><Text fw={500}>PowerPoint (.pptx)</Text> - Summary presentation slides</List.Item>
            </List>

            <Title order={5} mt="md">How to Generate</Title>
            <List type="ordered">
              <List.Item>Go to your project → Reports tab</List.Item>
              <List.Item>Click "Generate Report"</List.Item>
              <List.Item>Select analysis session(s) to include</List.Item>
              <List.Item>Choose format (Word, PDF, Excel, PowerPoint)</List.Item>
              <List.Item>Wait for generation to complete</List.Item>
              <List.Item>Download the report</List.Item>
            </List>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="collaboration" pt="md">
          <Stack gap="md">
            <Title order={4}>Real-Time Collaboration</Title>
            <Text>
              Multiple team members can work on the same analysis simultaneously with real-time updates.
            </Text>

            <Title order={5} mt="md">Features</Title>
            <List>
              <List.Item>See who else is viewing the analysis</List.Item>
              <List.Item>Real-time entry updates</List.Item>
              <List.Item>Conflict detection and resolution</List.Item>
              <List.Item>User presence indicators</List.Item>
            </List>

            <Title order={5} mt="md">Team Management</Title>
            <Text size="sm">
              Project owners and lead analysts can add team members via the "Team" tab in the project.
            </Text>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
