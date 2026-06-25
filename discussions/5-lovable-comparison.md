# Lovable comparison

Adrien

Okay, so I think the starting point we go from is you have an app where the data backend is managed by Aiven already. The starting point is you have a GitHub repo with a Next.js app deployed to Vercel and an Aiven backend.

Victor

So whatever, like, so Aiven MCP deploy that thing. Yeah.

Adrien

Well, yeah.

Victor

Did you see? Yeah, I guess you didn't see my thing because I connected MCP, I deployed it to, uh, it couldn't create paid resources on Aiven, but you can get free Postgres. For some reason they tried and said it wanted a paid account, or like you have to spend to create an instance on AWS of Postgres.

Adrien

Oh yeah, you can't choose cloud unless you pay.

Victor

But we have $300 of credit.

Adrien

Yeah, but you can't choose the cloud for some reason.

Victor

Okay, yeah, so there are—

Adrien

Only because like it's like 5x, for example.

Victor

So it created somewhere else, and then I gave it— also authorized it, um, with my Vercel. So I think it deployed the Next.js to Vercel and then linked the DB, and I have no idea how it did it, but it works. Can we ask another question to reverse engineer the other I asked it to document. I added to document. I asked it to document. Um, let's see, where is my commit? Oh, I pushed after you. Okay, cool. Um, we did some nasty things. Global for Postgres.

Adrien

Okay, so what does Aiven init do? Wait, are you recording now?

Victor

I'm recording.

Adrien

Okay, so the starting point is somehow you end up— yeah, you have an app, so it's an Aiven Well, to put it to myself, with Aiven

Victor

Mm-hmm.

Adrien

Data stack. And then you call Aiven init and it will use a skill to install our funky provider.

Victor

Mm-hmm.

Adrien

And you wrap the tree in this.

Victor

That part we didn't do, right?

Adrien

I don't know about the— the wrapping is like interesting, but also, well, it's sort of— it's quite brittle. Like, here's my thinking. Maybe we don't care about this, but like, if I have an editable, like, Next.js app deployed and then I make a change that, like, breaks the Next.js app, then the interface through which I'm editing that Next.js app is also now gone.

Victor

I don't think we have time to solve for this.

Adrien

Cool, that's fine.

Victor

Like, it should be self-healing, ideally. Right, because the thing can, like, if you use Codex locally, right, it will, you can ask it to use like browser skill playwright or anything.

Adrien

Yeah, I know, I know, but the point is like if my agent UI is being rendered by the very app that I'm editing.

Victor

Yeah, so your agent is editing the real code inside some container that we are building and hot reloading. And rendering somewhere. Yeah, right. So I think I'm not quite sure I get that part, how it's done. Like, a naive way is to spin up a container, check out the repo, run the repo locally, and then do ngrok, right?

Adrien

Not even.

Victor

Like if—

Adrien

Where's the container running? Presumably it's got like some, you know, I guess ngrok would work.

Victor

Yeah, hopefully it's not like exposing some random ports to the other side so everyone can see it, right? You guys internet okay? Seems very slow.

Adrien

I can't pnpm, am I right?

Victor

Yeah, this guy is, uh, okay. Anyway. Anyways, so why I was asking about the demo sequence, because the, the whole provisioning of a new fork was coming from vanity fork something something, right? Which that thing created a copy and an instance of an agent and provision stuff. And then agent is running, the Next app is running in dev mode, we are forwarding this to somewhere. But now I see what you mean, how do you talk to the agent if you just, if the only thing you look at is the Next.js app? Was even no changes, just on some local branch state.

Adrien

Provider can render something, right? That's like quite risky. It's an editable mode, right? Yeah. Like ideally you'd want to like iframe in something.

Victor

So we need, yeah. But if you are iframing something, your stuff is not interactive really. I mean, it's interactive in the way that you can click on stuff and it will do actions, but then you cannot—

Adrien

Maybe we need to like—

Victor

The provider, yeah, no, it's the Aiven provider that helps us select things and highlight and chat to them, right?

Adrien

I mean, wait, isn't the solution to this basically Lovable, right?

Victor

Yes.

Adrien

Right, so you click like "make change" and it takes you to some like other website that like, you know, like it is, it's like some, like the editor app with a Agent-like browser use window in there. Hello. Hi.

Victor

I'll just listen to music and enjoy the view for a moment.

Adrien

That's great. I hope you aren't stop you guys. No, you're good.

Victor

Okay, Lovable. How does it work?

Adrien

I'm sure many people have written articles on this. I think there's a tool that you can use to deploy your own Lovable, and like 90% should act the same. Okay, okay, so step one. Yeah. We need to figure out a stack that lets us do Lovable items. Like, basically all we have to do is make people Lovable with, uh, with the Aiven MCP and some other, like, stuff like running Postgres, like, queries and whatever. And, like, that's it. Okay, right, so this makes the whole shape pretty clear. Step 1, okay, well, one work stream is make a basic Lovable. That basic Lovable, where you give it a git repo and it, and you can like make changes and commit code, right?

Victor

Yeah, like local commits.

Adrien

Git, git repo. And hit make changes and commit and make PR. Okay, next we need to enhance this Lovable with Aiven, Aiven MCP, right? Now, and like, to be clear, like, a van fork would be the smarter way to do things, but then we're not using the MCP.

Victor

We have to make this like MCP, even though this is the home for it. No, but MCP has to be accessible as a tool. To the agent in the cloud, is it?

Adrien

No, no, no, we have to use the Aiven MCP.

Victor

We have to use it? The agent has to use.

Adrien

The agent, yeah.

Victor

So you have to spawn an agent that's bootstrapped with access to— yeah, Aiven MCP and probably Vercel. Yeah, right, because she— no, Vercel not necessarily.

Adrien

Vercel not necessarily if Well, okay, so like, so I make a bunch of changes. Let's say I deployed some like admin resources, right? Uh, how does this shit end up in Vercel is basically the question. Okay, I found it. But the Lovable— but we were in AI vibe coding SDK. How's pricing?

Victor

Okay, so I also asked the thing to— Lovable-style real-time editing is mostly sandbox dev environment plus iframe preview plus HMR plus chat visual context loop.

Adrien

Yeah.

Victor

Okay. Aiven MCP is mostly control-plane data infra tool, create fork services, read metrics. Yeah, should I close the door?

Adrien

That'd be great, thanks.

Victor

Uh, I need some water. How's the bar working? Uh, okay, I think the problem— I see, I see the problem is Aiven needs to create fork.

Adrien

So Aiven's gonna create a fork of the database, that's fine, and then like using that, yeah, using that locally. It kind of is fine, but using that within its sandbox is fine. When it makes a fork, you can get the actual connection string back. It can look at it and save it to a file. So that's like fine.

Victor

So we hot swap the—

Adrien

it's like very insecure.

Victor

We hot swap the database URL.

Adrien

Yeah.

Victor

Okay, that's still— you can totally do this in local environment, right?

Adrien

Yeah, this is fine.

Victor

Just point it to different databases.

Adrien

Just the fact that you, you know, point it to production database and then—

Victor

ah, security is not an issue here. Yeah, that's okay. Big y'all.

Adrien

Your data should be open. Okay, then, okay, so we make some changes. Let's say like, okay, let's say we're using Prisma schema for our migrations for our blog. If you make a beautiful Prisma migration, okay, great. Um, and like tested that it works against production data, it's like you can verify it as well by clicking around. Okay, you're great. Now you want to create a PR, right? And then you need to be able to check that Well, yeah, when you make that PR, you want to deploy— okay, so yeah, you want to deploy a preview to Vercel which connects to that new database, right? And then when it merges, you want it to run the migration.

Victor

I think we don't have the solve for this. I see the problem there. Yeah.

Adrien

Right. And if you—

Victor

You will have to drop the previous connection. You will have to reconcile any new records in database, right?

Adrien

No, no, no. We don't care about new records. We just need to migrate the production database.

Victor

I know you're right.

Adrien

The bigger problem is for like new— okay, let's say like I, you know, branch off, I'm like, I need a ClickHouse, baby. So it makes a ClickHouse, my local development, and that's all great. When I then merge my PR, how does the resource get permission in Aiven? And also How does the connection string to that resource appear in Vercel environment in production?

Victor

Mm-hmm. So you're saying GitHub also needs a way to, to know that?

Adrien

I don't know, that the problem to solve is you made some branch resource that now needs to become a production resource. Your production, your SaaS environment. How does that happen? I mean, what— we should ask the agents about canonical solutions to that. I asked them.

Victor

Well, what you need is you need the connection string, right?

Adrien

Ideally we can— so ideally, like, when you're working on branch, um, I think get to my Yeah, I guess it's what it does. Yeah. Okay. And then if you go to play it, well, gosh, yeah, this is true.

Victor

I don't think we solved for this. Like, where we end is this thing opens up your—

Adrien

that's an engineer using his engineer's problem to Do you want me to try to remove the NitroGame?

Victor

Just remove it. I don't think it actually—

Adrien

okay, okay, let's— yeah, fine, let's not deal with the new. Okay, we know NitroGame, so migrations are fine.

Victor

I think there's no down resources, like there's no destroying of the resources that it created currently. Uh, the MCP thing, that's fine.

Adrien

We don't need the MCPs, we're using purely to— it's an organization for migration and it has one public objective, right? Right.

Victor

The migration is like, well, the MCP creates a resource, but you provision a temporary resource that just for testing, then you test the branch against that, and then yeah, you have your branch When it's promoted to prod, it just migrates the prod database and that thing can be cleaned. So there's like a GC somewhere.

Adrien

Yeah, yeah, you need to clean up here. Okay, when the branch from GitHub is gone, let's say like, yeah, some magical—

Victor

except for new resources where it knows it needs a new env variable, so something needs to provision it.

Adrien

I think we can— so I think It says you're active. Yeah, free. The way we should demo this, you have like your permissions.

Victor

Okay, now I can see. I think the core selling point of this is being able to preview different—

Adrien

you can make a new project—

Victor

branches with different changes, and I did it with infra changes needed, right? The key demo point here is to be able to preview, live preview, different branches with different changes, right? So you have a couple of instances. That's right. I think that's what we don't care about, the merge to main and what happens after that. Yeah. So I think the core piece is like isn't multi-window allowable, basically.

Adrien

But our demo needs to show that. Yeah. Multiple windows.

Victor

Is it?

Adrien

Whether or not that's actually one window or multiple, that's fine. Okay. And then We need to get Stan's pet peeve in there. The metadata. Fuck. In the table or schema. Mm. And some brownie points.

Victor

That's what he wanted, yes.

Adrien

When some brownie points.

Victor

Okay. Which is very true, right? You ask the agent to document any new database, whatever, as we do changes in the schema and likewise in the migration code comments, like hardwire them into the actual thing.

Adrien

Okay, fantastic. Okay, so how does this work then?

Victor

Should we have a branch?

Adrien

Branch with live MD docs so that we can have everything planned and contracted so we know how we work together. Yeah, you want to add those?

Victor

Yeah, sure.

Adrien

One branch and just done the planning docs. Oh, you just want that done, the planning docs made? That would be nice. Yeah. Okay. Um, everything hinges on getting this going. Okay, actually put people level.

Victor

Sure. Wait, hold on. The local docs say Aiven Apps is stateless.

Adrien

Huh?

Victor

Aiven Apps is stateless?

Adrien

Just delete the apps docs because they're not actually— well, it's not live yet, right?

Victor

So Vercel or sandbox provider should host the preview runtime. Aiven should power the forked state layer. Yeah, that's right. Like we need, we need a change that requires a database. Or even faster, what he was saying, right? Ideally the agent says, hmm, no database changes needed. So we just, can we connect to the same database? You know what I mean?

Adrien

Like you're not connecting probably to the We can give it a read-only connection to the current database. Oh no, this is tricky, right?

Victor

Because like, you want to test destructive actions on the prod database, right?

Adrien

Yeah, if you don't want to trust your agent to decide whether or not—

Victor

oh, I think it's okay, we can trust that. But yeah, ideally on just a clone of a database. Do we have Vercel credits from these guys?

Adrien

Huh?

Victor

Do we have Vercel credits? Because I think Vercel has like a lot of these sandbox things out of the box.

Adrien

We have a normal Vercel. I have a Vercel sub.

Victor

Oh, it's Kaloop.

Adrien

What the fuck? Hm, still only 21%.

Victor

I'm going to keep charging. I think it's a smaller charger, so it's not Like it has 60 watts probably out.

Adrien

Small baby charger.

Victor

It is because I have a small baby laptop. Water, water please. Can I have lots of water?

Adrien

Where can you transfer that and ship it into—
