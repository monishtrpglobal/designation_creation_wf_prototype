"use client";

import { useMemo, useState } from "react";
import { Accordion, AccordionItem } from "@/ds/Accordion";
import { Alert, type AlertType } from "@/ds/Alert";
import { Badge } from "@/ds/Badge";
import { Button } from "@/ds/Button";
import { Card, type CardVariant } from "@/ds/Card";
import { Checkbox, CheckboxGroup, type CheckboxShape, type CheckboxSize } from "@/ds/Checkbox";
import { Link } from "@/ds/Link";
import { MultiSelect } from "@/ds/MultiSelect";
import { Pagination, type PageSize } from "@/ds/Pagination";
import { ProgressLine, ProgressRing, ProgressTrack, type ProgressLineSize, type ProgressRingSize, type ProgressTrackStage } from "@/ds/Progress";
import { RadioCard, RadioCardGroup } from "@/ds/RadioCard";
import { RowMenu } from "@/ds/RowMenu";
import { SegmentedControl } from "@/ds/SegmentedControl";
import { Select } from "@/ds/Select";
import { Table, type SortState } from "@/ds/Table";
import { Tabs } from "@/ds/Tabs";
import { TagsField } from "@/ds/TagsField";
import { TextArea } from "@/ds/TextArea";
import { TextField } from "@/ds/TextField";
import { Tooltip, type TooltipWidth } from "@/ds/Tooltip";

const alertTypes: AlertType[] = ["info", "success", "warning", "error"];
const cardVariants: CardVariant[] = ["flat", "hoverable", "border"];
const tooltipWidths: TooltipWidth[] = ["default", "wide", "single-line"];
const shapes: CheckboxShape[] = ["square", "round"];
const sizes: CheckboxSize[] = ["sm", "md"];
const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
  { value: "d", label: "Option D" },
];

const lineSizes: ProgressLineSize[] = ["xs", "sm", "md", "lg", "xl"];
const ringSizes: ProgressRingSize[] = ["sm", "md", "lg"];
const trackStages: ProgressTrackStage[] = ["creating", "profile-and-tr", "synced", "error"];
const tableRows = [
  { id: "1", name: "Revenue recognition", status: "Ready" },
  { id: "2", name: "Lease accounting", status: "Name clash" },
  { id: "3", name: "Tax reporting", status: "Ready" },
];

export function Gallery() {
  const [search, setSearch] = useState("Value");
  const [note, setNote] = useState("This note is longer than the limit.");
  const [radio, setRadio] = useState("selected");
  const [segment, setSegment] = useState("day");
  const [sort, setSort] = useState<SortState | null>(null);
  const [clickedRow, setClickedRow] = useState("none");
  const [menuAction, setMenuAction] = useState("none");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);

  const sortedRows = useMemo(() => {
    const copy = [...tableRows];
    if (!sort) {
      return copy;
    }
    copy.sort((a, b) => {
      const left = a[sort.key as "name" | "status"];
      const right = b[sort.key as "name" | "status"];
      const order = left.localeCompare(right);
      return sort.direction === "asc" ? order : -order;
    });
    return copy;
  }, [sort]);

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, 50);

  return (
    <>
      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Alert</h2>
        {alertTypes.map((type) => (
          <div key={type} className="grid max-w-xl gap-s8">
            <p className="text-label-l1">{type}</p>
            <Alert type={type} title="Title" dismissible>
              This is an alert message.
            </Alert>
            <Alert type={type} compact showTitle={false}>
              This is an alert message that stays on one line and truncates when the row is narrow.
            </Alert>
            <Alert type={type} showTitle={false} showBorder={false}>
              Message without a title or border.
            </Alert>
            <Alert
              type={type}
              title="Title"
              action={
                <Button variant="secondary" size="sm">
                  Action
                </Button>
              }
              secondaryAction={
                <Button variant="secondary" size="sm">
                  Cancel
                </Button>
              }
            >
              This is an alert message.
            </Alert>
          </div>
        ))}
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Link</h2>
        <div className="flex flex-wrap items-center gap-s16">
          <Link href="#link">Link text</Link>
          <Link href="#link" disabled>
            Link text
          </Link>
        </div>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Tooltip</h2>
        <div className="flex flex-wrap items-center gap-s16">
          {tooltipWidths.map((width) => (
            <Tooltip
              key={width}
              width={width}
              opened
              label={
                width === "single-line"
                  ? "Tooltip text"
                  : "Tooltip text that wraps once it reaches the maximum width for this variant."
              }
            >
              <span className="text-body">{width}</span>
            </Tooltip>
          ))}
          <Tooltip label="Tooltip text" withArrow position="bottom" opened>
            <span className="text-body">arrow</span>
          </Tooltip>
        </div>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Card</h2>
        <div className="grid gap-s16 md:grid-cols-3">
          {cardVariants.map((variant) => (
            <Card
              key={variant}
              variant={variant}
              header="Card title"
              body="Card content goes here. Cards group related information on the page canvas."
              footer="Footer"
              showFooter
            >
              <Badge variant="info" size="sm">
                Content slot
              </Badge>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Text field</h2>
        <div className="flex flex-wrap items-start gap-s16">
          <div className="w-80">
            <TextField label="Label" placeholder="Placeholder" tooltip="Helper text for this field." />
          </div>
          <div className="w-80">
            <TextField
              type="search"
              label="Search"
              value={search}
              onChange={setSearch}
              tooltip="Search the list."
            />
          </div>
          <div className="w-80">
            <TextField label="Label" size="sm" placeholder="Placeholder" />
          </div>
          <div className="w-80">
            <TextField label="Label" defaultValue="Value" error="Error message" />
          </div>
          <div className="w-80">
            <TextField label="Label" placeholder="Placeholder" disabled />
          </div>
          <div className="w-80">
            <TextField label="Label" defaultValue="Read only" readOnly />
          </div>
        </div>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Text area</h2>
        <div className="flex flex-wrap items-start gap-s16">
          <div className="w-80">
            <TextArea label="Message" placeholder="Write a message" tooltip="Shown to reviewers." showCounter maxLength={200} />
          </div>
          <div className="w-80">
            <TextArea
              label="Message"
              value={note}
              onChange={setNote}
              showCounter
              maxLength={24}
              error="Error message"
            />
          </div>
          <div className="w-80">
            <TextArea label="Message" placeholder="Write a message" disabled />
          </div>
        </div>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Select</h2>
        <div className="flex flex-wrap items-start gap-s16">
          <div className="w-80">
            <Select label="Select" data={options} tooltip="Pick one option." />
          </div>
          <div className="relative min-h-64 w-80">
            <Select label="Select" data={options} defaultValue="b" dropdownOpened />
          </div>
          <div className="w-80">
            <Select label="Select" data={options} defaultValue="b" error="Select a value" />
          </div>
          <div className="w-80">
            <Select label="Select" data={options} disabled />
          </div>
          <div className="relative min-h-40 w-80">
            <Select label="Select" data={options} loading dropdownOpened />
          </div>
          <div className="relative min-h-40 w-80">
            <Select label="Select" data={[]} dropdownOpened />
          </div>
        </div>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Multi select</h2>
        <div className="flex flex-wrap items-start gap-s16">
          <div className="w-80">
            <MultiSelect label="Select options" data={options} defaultValue={["b", "c"]} />
          </div>
          <div className="relative min-h-64 w-80">
            <MultiSelect label="Select options" data={options} defaultValue={["b", "c"]} dropdownOpened />
          </div>
          <div className="w-80">
            <MultiSelect label="Select options" data={options} defaultValue={["b", "c"]} error="Select a value" />
          </div>
          <div className="w-80">
            <MultiSelect label="Select options" data={options} defaultValue={["b", "c"]} disabled />
          </div>
        </div>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Tags field</h2>
        <div className="flex flex-wrap items-start gap-s16">
          <div className="w-80">
            <TagsField label="Tags" tooltip="Free-form tags." />
          </div>
          <div className="w-80">
            <TagsField label="Tags" defaultValue={["Risk", "Audit"]} />
          </div>
          <div className="w-80">
            <TagsField label="Tags" defaultValue={["Risk", "Audit", "Policy"]} maxTags={3} />
          </div>
          <div className="w-80">
            <TagsField label="Tags" defaultValue={["Risk", "Audit"]} disabled />
          </div>
        </div>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Checkbox</h2>
        {shapes.map((shape) => (
          <div key={shape} className="grid gap-s8">
            <p className="text-label-l1">{shape}</p>
            {sizes.map((size) => (
              <div key={size} className="flex flex-wrap items-center gap-s16">
                <Checkbox shape={shape} size={size} label={`${size} unchecked`} />
                <Checkbox shape={shape} size={size} label={`${size} checked`} defaultChecked />
                <Checkbox shape={shape} size={size} label={`${size} mixed`} indeterminate />
                <Checkbox shape={shape} size={size} label={`${size} disabled`} disabled />
                <Checkbox shape={shape} size={size} label={`${size} error`} error />
                <Checkbox shape={shape} size={size} aria-label={`${shape} ${size} without a label`} />
              </div>
            ))}
          </div>
        ))}
        <CheckboxGroup label="Legend" error="Select at least one option" defaultValue={["a"]}>
          <Checkbox value="a" label="Option A" />
          <Checkbox value="b" label="Option B" />
          <Checkbox value="c" label="Option C" />
        </CheckboxGroup>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Radio card</h2>
        <RadioCardGroup value={radio} onChange={setRadio}>
          <div className="grid max-w-xl gap-s12">
            <RadioCard value="idle" title="Option title" subtitle="Short supporting description" />
            <RadioCard value="selected" title="Option title" subtitle="Short supporting description" />
            <RadioCard value="unavailable" title="Option title" subtitle="Short supporting description" unavailable />
            <RadioCard value="locked" title="Option title" subtitle="Short supporting description" disabled />
          </div>
        </RadioCardGroup>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Tabs</h2>
        <Tabs
          variant="pill"
          defaultValue="overview"
          items={[
            {
              value: "overview",
              label: "Overview",
              count: (
                <Badge variant="light" size="sm">
                  3
                </Badge>
              ),
              panel: <p className="text-body">Overview panel</p>,
            },
            { value: "members", label: "Members", panel: <p className="text-body">Members panel</p> },
            { value: "settings", label: "Settings", disabled: true, panel: <p className="text-body">Settings panel</p> },
          ]}
        />
        <Tabs
          variant="underline"
          orientation="horizontal"
          defaultValue="overview"
          items={[
            {
              value: "overview",
              label: "Overview",
              count: (
                <Badge variant="light" size="sm">
                  12
                </Badge>
              ),
              panel: <p className="text-body">Underline panel</p>,
            },
            { value: "members", label: "Members", panel: <p className="text-body">Members panel</p> },
          ]}
        />
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Segmented control</h2>
        <SegmentedControl
          aria-label="Range"
          value={segment}
          onChange={setSegment}
          data={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
        />
        <div className="max-w-sm">
          <SegmentedControl
            aria-label="Range full width"
            size="md"
            fullWidth
            value={segment}
            onChange={setSegment}
            data={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        </div>
      </section>

      <section className="grid max-w-xl gap-s16">
        <h2 className="text-label-l1 text-strong">Accordion</h2>
        <Accordion variant="filled" chevron="left" defaultValue="one">
          <AccordionItem
            value="one"
            label="Accordion item"
            badge={
              <Badge variant="light" size="sm">
                4
              </Badge>
            }
            badge2={<Badge variant="completed">Ready</Badge>}
          >
            Accordion panel content goes here.
          </AccordionItem>
          <AccordionItem value="two" label="Second item" disabled>
            Hidden while disabled.
          </AccordionItem>
        </Accordion>
        <Accordion variant="separated" chevron="right">
          <AccordionItem value="one" label="Separated item">
            Panel slot
          </AccordionItem>
        </Accordion>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Row menu</h2>
        <div className="flex items-center gap-s16">
          <RowMenu
            items={[
              { label: "Profile", onClick: () => setMenuAction("Profile") },
              { label: "Settings", onClick: () => setMenuAction("Settings") },
              { label: "Log out", onClick: () => setMenuAction("Log out") },
            ]}
          />
          <p className="text-body">Last action: {menuAction}</p>
        </div>
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Table</h2>
        <p className="text-body">Clicked row: {clickedRow}</p>
        <Table
          columns={[
            { key: "name", label: "Name", sortable: true },
            { key: "status", label: "Status", sortable: true },
            { key: "id", label: "Id" },
          ]}
          rows={sortedRows}
          getRowKey={(row) => row.id}
          sort={sort}
          onSortChange={setSort}
          onRowClick={(row) => setClickedRow(row.name)}
        />
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Pagination</h2>
        <Pagination
          page={page}
          total={50}
          pageSize={pageSize}
          range={`${rangeStart}-${rangeEnd} of 50`}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>

      <section className="grid gap-s16">
        <h2 className="text-label-l1 text-strong">Progress</h2>
        <div className="grid max-w-xl gap-s8">
          {lineSizes.map((size) => (
            <ProgressLine key={size} size={size} value={40} label={`${size} progress`} />
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-s16">
          {ringSizes.map((size) => (
            <ProgressRing key={size} size={size} value={40} />
          ))}
          <ProgressRing size="md" value={0} indeterminate />
        </div>
        <div className="grid max-w-xl gap-s16">
          {trackStages.map((stage) => (
            <ProgressTrack key={stage} stage={stage} />
          ))}
        </div>
      </section>
    </>
  );
}
