import { ArrowRight, Check, ChevronRight, Info, Sparkles } from 'lucide-react'
import { Text, Title, Heading, Lead } from '@/components/ui/text'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Block, Demo, RampStep, Sub, Swatch, TokenSwatch } from './parts'
import { ToastDemo } from './demos'

const NEUTRAL_RAMP = [
  ['50', 'bg-neutral-50'],
  ['100', 'bg-neutral-100'],
  ['200', 'bg-neutral-200'],
  ['300', 'bg-neutral-300'],
  ['400', 'bg-neutral-400'],
  ['500', 'bg-neutral-500'],
  ['600', 'bg-neutral-600'],
  ['700', 'bg-neutral-700'],
  ['800', 'bg-neutral-800'],
  ['900', 'bg-neutral-900'],
  ['950', 'bg-neutral-950'],
]
const ORCHID_RAMP = [
  ['50', 'bg-orchid-50'],
  ['100', 'bg-orchid-100'],
  ['200', 'bg-orchid-200'],
  ['300', 'bg-orchid-300'],
  ['400', 'bg-orchid-400'],
  ['500', 'bg-orchid-500'],
  ['600', 'bg-orchid-600'],
  ['700', 'bg-orchid-700'],
  ['800', 'bg-orchid-800'],
  ['900', 'bg-orchid-900'],
  ['950', 'bg-orchid-950'],
]
const DUSK_RAMP = [
  ['50', 'bg-dusk-50'],
  ['100', 'bg-dusk-100'],
  ['200', 'bg-dusk-200'],
  ['300', 'bg-dusk-300'],
  ['400', 'bg-dusk-400'],
  ['500', 'bg-dusk-500'],
  ['600', 'bg-dusk-600'],
  ['700', 'bg-dusk-700'],
  ['800', 'bg-dusk-800'],
  ['900', 'bg-dusk-900'],
  ['950', 'bg-dusk-950'],
]

const TYPE_SCALE = [
  ['Title', 'display', 'Montserrat SemiBold'],
  ['Heading 1', 'h1', 'Montserrat Medium'],
  ['Heading 2', 'h2', 'Montserrat Medium'],
  ['Sub-heading', 'subheading', 'Google Sans Flex Medium'],
  ['Lead', 'lead', 'Google Sans Flex Regular'],
  ['Body', 'body', 'Google Sans Flex Regular'],
  ['Caption', 'caption', 'Google Sans Flex Regular'],
] as const

const RADII = [
  ['sm', 'rounded-sm'],
  ['md', 'rounded-md'],
  ['lg', 'rounded-lg'],
  ['xl', 'rounded-xl'],
  ['2xl', 'rounded-2xl'],
  ['3xl', 'rounded-3xl'],
  ['full', 'rounded-full'],
]

export default function StyleguidePage() {
  return (
    <div>
      <div className="mb-16 flex flex-col gap-4">
        <p className="eyebrow text-brand">Design system</p>
        <Title>
          The <span className="text-gradient-brand">design system</span>
        </Title>
        <Lead className="max-w-2xl">
          Reusable tokens and components built on shadcn/ui and Tailwind v4.
          Toggle the theme in the header to check both modes.
        </Lead>
      </div>

      {/* ---------------- COLOUR ---------------- */}
      <Block
        id="colour"
        title="Colour"
        description="Neutral-first. Greys carry the layout; the accents and gradient appear sparingly. All values are OKLCH and AA-verified in use."
      >
        <Sub
          title="Primary palette — neutrals"
          className="grid grid-cols-3 gap-4 sm:grid-cols-6"
        >
          <Swatch name="White" value="#ffffff" className="bg-neutral-0" />
          <Swatch name="Soft White" value="#f4f6f9" className="bg-soft-white" />
          <Swatch name="Cloud" value="#e6eaed" className="bg-cloud" />
          <Swatch name="Fog" value="#c9ced1" className="bg-fog" />
          <Swatch name="Charcoal" value="#2a2c2d" className="bg-charcoal" />
          <Swatch name="Black" value="#000000" className="bg-neutral-1000" />
        </Sub>

        <Sub
          title="Accent palette"
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <Swatch name="Orchid" value="#b27dbc" className="bg-orchid" />
          <Swatch name="Lilac" value="#e4cfe8" className="bg-lilac" />
          <Swatch name="Lavender" value="#b5b7dc" className="bg-lavender" />
          <Swatch name="Dusk" value="#7079b7" className="bg-dusk" />
        </Sub>

        <Sub title="Neutral ramp" className="flex gap-1.5">
          {NEUTRAL_RAMP.map(([step, cls]) => (
            <RampStep key={step} step={step} className={cls} />
          ))}
        </Sub>
        <Sub title="Orchid ramp" className="flex gap-1.5">
          {ORCHID_RAMP.map(([step, cls]) => (
            <RampStep key={step} step={step} className={cls} />
          ))}
        </Sub>
        <Sub title="Dusk ramp" className="flex gap-1.5">
          {DUSK_RAMP.map(([step, cls]) => (
            <RampStep key={step} step={step} className={cls} />
          ))}
        </Sub>

        <Sub
          title="Semantic tokens"
          className="grid grid-cols-3 gap-4 sm:grid-cols-6"
        >
          <TokenSwatch
            name="background"
            surface="bg-background"
            fg="text-foreground"
          />
          <TokenSwatch
            name="primary"
            surface="bg-primary"
            fg="text-primary-foreground"
          />
          <TokenSwatch
            name="secondary"
            surface="bg-secondary"
            fg="text-secondary-foreground"
          />
          <TokenSwatch
            name="muted"
            surface="bg-muted"
            fg="text-muted-foreground"
          />
          <TokenSwatch
            name="accent"
            surface="bg-accent"
            fg="text-accent-foreground"
          />
          <TokenSwatch
            name="card"
            surface="bg-card"
            fg="text-card-foreground"
          />
          <TokenSwatch
            name="brand"
            surface="bg-brand"
            fg="text-brand-foreground"
          />
          <TokenSwatch
            name="brand-subtle"
            surface="bg-brand-subtle"
            fg="text-brand-subtle-foreground"
          />
          <TokenSwatch
            name="destructive"
            surface="bg-destructive"
            fg="text-destructive-foreground"
          />
          <TokenSwatch
            name="success"
            surface="bg-success"
            fg="text-success-foreground"
          />
          <TokenSwatch
            name="warning"
            surface="bg-warning"
            fg="text-warning-foreground"
          />
          <TokenSwatch
            name="info"
            surface="bg-info"
            fg="text-info-foreground"
          />
        </Sub>
      </Block>

      {/* ---------------- GRADIENT ---------------- */}
      <Block
        id="gradient"
        title="Gradient"
        description="Accent colours blended for hero panels, call-outs and highlights. Keep gradients away from body copy."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <div className="h-32 rounded-2xl bg-gradient-brand" />
            <span className="font-mono text-xs text-muted-foreground">
              bg-gradient-brand
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-32 rounded-2xl bg-gradient-mesh" />
            <span className="font-mono text-xs text-muted-foreground">
              bg-gradient-mesh
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="rounded-2xl bg-gradient-brand p-px">
              <div className="flex h-32 items-center justify-center rounded-[calc(var(--radius-2xl)-1px)] bg-background px-4 text-center text-sm text-muted-foreground">
                Gradient border
              </div>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              gradient border
            </span>
          </div>
        </div>
        <Heading as="p">
          Highlight a word with{' '}
          <span className="text-gradient-brand">the accent gradient.</span>
        </Heading>
      </Block>

      {/* ---------------- TYPOGRAPHY ---------------- */}
      <Block
        id="typography"
        title="Typography"
        description="Montserrat for titles and headers, Google Sans Flex for sub-headers, body and UI. One fluid scale, switchable per surface: editorial (default) or .typography-dense for app UIs."
      >
        <Tabs defaultValue="editorial">
          <TabsList>
            <TabsTrigger value="editorial">Editorial</TabsTrigger>
            <TabsTrigger value="dense">Dense</TabsTrigger>
          </TabsList>
          {(['editorial', 'dense'] as const).map((profile) => (
            <TabsContent
              key={profile}
              value={profile}
              className={`typography-${profile} flex flex-col divide-y divide-border`}
            >
              {TYPE_SCALE.map(([name, variant, font]) => (
                <div
                  key={name}
                  className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <Text as="p" variant={variant}>
                    Streamline your analysis
                  </Text>
                  <div className="flex shrink-0 flex-col text-left sm:text-right">
                    <span className="text-sm font-medium text-foreground">
                      {name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {variant} · {font}
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between gap-8 py-5">
                <p className="eyebrow text-brand">Eyebrow label</p>
                <span className="font-mono text-xs text-muted-foreground">
                  .eyebrow
                </span>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Block>

      {/* ---------------- RADIUS ---------------- */}
      <Block
        id="radius"
        title="Radius"
        description="Soft, rounded forms. Pills for actions."
      >
        <div className="flex flex-wrap gap-6">
          {RADII.map(([name, cls]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div
                className={`size-20 border border-border bg-brand-subtle ${cls}`}
              />
              <span className="font-mono text-xs text-muted-foreground">
                {name}
              </span>
            </div>
          ))}
        </div>
      </Block>

      {/* ---------------- BUTTONS ---------------- */}
      <Block id="buttons" title="Buttons">
        <Sub title="Variants" className="">
          <Demo>
            <Button>Default</Button>
            <Button variant="brand">Brand</Button>
            <Button variant="gradient">Gradient</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </Demo>
        </Sub>
        <Sub title="Sizes">
          <Demo>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra large</Button>
            <Button size="icon" aria-label="Next">
              <ArrowRight />
            </Button>
          </Demo>
        </Sub>
        <Sub title="With icon & states">
          <Demo>
            <Button variant="brand">
              <Sparkles />
              Analyse
            </Button>
            <Button variant="outline">
              Continue
              <ArrowRight />
            </Button>
            <Button disabled>Disabled</Button>
            <Button variant="gradient" disabled>
              Disabled
            </Button>
          </Demo>
        </Sub>
      </Block>

      {/* ---------------- BADGES ---------------- */}
      <Block id="badges" title="Badges">
        <Demo>
          <Badge>Default</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="brand-subtle">Brand subtle</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="brand-subtle">
            <Check className="size-3" />
            SOC 2
          </Badge>
        </Demo>
      </Block>

      {/* ---------------- FORM ---------------- */}
      <Block id="forms" title="Form controls">
        <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sg-email">Work email</Label>
            <Input id="sg-email" type="email" placeholder="you@company.com" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sg-team">Team size</Label>
            <Select>
              <SelectTrigger id="sg-team">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Just me</SelectItem>
                <SelectItem value="2">2–10</SelectItem>
                <SelectItem value="3">11–50</SelectItem>
                <SelectItem value="4">50+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="sg-note">Notes</Label>
            <Textarea id="sg-note" placeholder="Tell us about your research…" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-2">
            <Checkbox id="sg-check" defaultChecked />
            <Label htmlFor="sg-check">Email me product updates</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="sg-switch" defaultChecked />
            <Label htmlFor="sg-switch">Auto-transcribe</Label>
          </div>
          <RadioGroup defaultValue="weekly" className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="weekly" id="sg-r1" />
              <Label htmlFor="sg-r1">Weekly</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="monthly" id="sg-r2" />
              <Label htmlFor="sg-r2">Monthly</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex max-w-md flex-col gap-6">
          <Slider defaultValue={[60]} max={100} step={1} />
          <Progress value={64} />
        </div>
      </Block>

      {/* ---------------- DATA & FEEDBACK ---------------- */}
      <Block id="feedback" title="Feedback & data display">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Project insight</CardTitle>
              <CardDescription>
                Surfaced from 24 transcripts across 3 markets.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-body text-muted-foreground">
              Participants consistently raised onboarding friction in the first
              session, with pricing clarity as a secondary theme.
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="brand" size="sm">
                Open
              </Button>
              <Button variant="ghost" size="sm">
                Dismiss
              </Button>
            </CardFooter>
          </Card>

          <div className="flex flex-col gap-4">
            <Alert>
              <Info />
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>
                Translation runs automatically for non-English material.
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-brand-subtle text-brand-subtle-foreground">
                  CL
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="themes" className="max-w-xl">
          <TabsList>
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          <TabsContent
            value="themes"
            className="text-body text-muted-foreground"
          >
            Three dominant themes across the dataset.
          </TabsContent>
          <TabsContent
            value="quotes"
            className="text-body text-muted-foreground"
          >
            Representative quotes, each linked to its source.
          </TabsContent>
          <TabsContent
            value="summary"
            className="text-body text-muted-foreground"
          >
            An executive summary, ready to share.
          </TabsContent>
        </Tabs>

        <Accordion type="single" collapsible className="max-w-xl">
          <AccordionItem value="a">
            <AccordionTrigger>How is this insight sourced?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Every insight links back to the exact moment in the transcript.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Can I edit the analysis?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes. The researcher always stays in the loop.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Block>

      {/* ---------------- OVERLAYS ---------------- */}
      <Block id="overlays" title="Overlays & menus">
        <Demo>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a new analysis</DialogTitle>
                <DialogDescription>
                  Upload material or connect a source to begin.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost">Cancel</Button>
                <Button variant="brand">Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Menu
                <ChevronRight />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Project</DropdownMenuLabel>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="text-sm text-muted-foreground">
              A small surface for secondary actions and detail.
            </PopoverContent>
          </Popover>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>Linked to the source moment</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <ToastDemo />
        </Demo>
      </Block>
    </div>
  )
}
