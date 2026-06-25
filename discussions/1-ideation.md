Adrien:

Okay, so I made a template repo with Next.js just in case we need it based on coded design system.

Victor:

No.

Adrien:

You can change the colors and fonts and everything you want. No, no, it's just because like there were some good primitives in there.

Victor:

Shameless plugs.

Adrien:

There are some good primitives in there.

Oscar:

All right, all right.

Adrien:

Yeah, but now at least it won't look like vibe slop when we present it. You can change the colors and the fonts. That's all fine. Okay.

Victor:

Are you recording stuff?

Adrien:

Yeah. What the fuck are we doing?

Victor:

So walk back from the demo.

Adrien:

All right. Well, I have my pitch in mind, but good. I want to hear if you guys have. have any alternative suggestions first.

Victor:

I think my demo was the one with the app, not with the marketing website, and where we open a Slack channel and then show 2 things. Maybe 3. First one is all the AWS alerts, right? Wait, are we mixing AISRE with—

Adrien:

I don't know, mine was not going to be AISRE.

Victor:

Well, so yours is just opening up, um, and then there's like a Make change. Make change, right?

Adrien:

Yeah, make your commercial team productive.

Oscar:

This sounds like Sparkles as well.

Adrien:

Yeah.

Oscar:

Okay.

Victor:

He just wrapped Cloud Code.

Adrien:

Yeah.

Victor:

So it's like a lovable, like, interface where you just put your thing, right? But I guess it connects to your codebase as opposed to just a forest-like Reaper, unlovable.

Adrien:

So yeah, I mean, it's similar to that. Most things that you come up with will be similar to something. I'm sure I can find an AI SRE incident, right? Yes.

Victor:

Can we— yeah, well, how about we mix 2 of them?

Adrien:

Focus is better. It's not a, here's this and that in your demo. That's like, you need a coherent, like, here is what it does. Because the AI SRE would be used by developers mostly.

Victor:

Yeah.

Adrien:

Right.

Victor:

And then the other part will be used by commercial people and support in double support, right? But what it needs is the, the input is there's an issue, go look at it, and then spin up an environment for me to preview the changes, right? And do that without having to do anything on my machine, right?

Oscar:

Yeah.

Victor:

Which means you can talk to it in Slack directly. So your thread is the reference to the work tree.

Adrien:

I like putting Slack in. I think that's good. Yeah. Wait, isn't this just Isn't a better way of framing this than like an engineer for every commercial person?

Oscar:

Hmm, I like.

Victor:

Right, so we like Slack.

Adrien:

Like, it's basically like, that's what we did with Ask Club. It's like, stop fucking bothering me with your shit. Just like, just do it yourself. Yeah, but I guess it's, yeah, it's like the It's deeper than that. It ties into your observability stack, into making changes, into asking questions, and live previewing any changes.

Oscar:

I think that might be maybe even more interesting. Not just code changes, but answering questions about docs and Yeah, but that's just—

Adrien:

it needs to be more than cloud code. Like, okay, why do I like the SRE and the market and, and like the app side is because there's an actual data like platform aspect which you need for Aiven. And Aiven also exposes telemetry via MCP. And so like you'd sort of be doing both of those things.

Victor:

Oh wait, hold on, repeat that. Why do you like SRE?

Adrien:

Because like even MCP exposes like ways to, I think, gather telemetry. And also like it can introspect the schema from what I understand and write queries against it.

Victor:

Mm-hmm.

Adrien:

So that'd be good. Also like it'd be like sick if you could like sort of clone— yeah, like imagine this. Imagine that you're like, okay, like there's an issue with a customer's like project or whatever. So it like clones the database and then like As a commercial person, you can sort of safely execute whatever queries you want and make changes as well against that database to prove that you fixed the issue. Because it's a clone of the database. Nothing's going to go wrong if you do this.

Victor:

But it's an empty clone.

Adrien:

No, no. Clone from.

Victor:

From where?

Adrien:

From production.

Victor:

This is kind of against our T&Cs.

Adrien:

It's— ignore code loop, it's— fuck it.

Victor:

But it's the perfect demo for us.

Adrien:

Yeah, well, we can't do it with our product. That's not possible.

Victor:

But that's the perfect demo.

Adrien:

Yeah, yeah, but like, to make code loop work on whatever stack we need to do this, Are you sure?

Victor:

Can we just leave it in the loop for a night and then we'll figure out?

Adrien:

Okay, we should have a backup though.

Victor:

Because I mean, if you think of it, you can— database? Temporal?

Adrien:

Temporal, you can run like locally though. So like whatever fork you have, you can just run it locally. Yeah.

Victor:

So I think what we can do is we can, we we can find specific issues that happen for real but do not touch the bits that we think will be challenging to port, right? For example, if we think Cortex is going to be a pain in the ass to port—

Adrien:

Oh, that's fine, you just delete Grids and chat 1.0. Also, Pinecone is one of the things you can't run.

Victor:

Yeah, right?

Adrien:

So you need something where I mean, they can't run Pinecone. We could like ask Claude to make a simple version of Kodeep.

Victor:

I mean, I think the dumbest version of this is just the next part, right? Because you can say plausibly that, wow, there's like a descender on this piece of text which is clipped, go and fix it, right? Real issue that happened and was fixed. To preview that, you just need the Next app, right? There's the problem with auth that you need to actually hook into the AuthDB in the DB for it to let you log into the app, but the rest is kind of fine.

Adrien:

I think, I think you don't gain that much from doing it against a real application with real issues.

Victor:

It's just for the demo because then you see—

Adrien:

That's what I'm saying. For the demo, you might as well just make up an application that has a made-up issue. Like it's an actual issue that you— basically, you introduce a bug in your demo application by purpose.

Victor:

But then you can't make a claim that you made it work for a product that is generating revenue and has real issues and it actually affects the product.

Adrien:

That's fine. You don't have to show that. Why do you have to show that?

Victor:

Because then it's— I think it adds kind of more power to the demo. Like, you don't have to make it— like, if you make it on a pretend website, it will feel like a pretend website, right? Because you have an edge that not many people have, which is a real product, right, that has real issues.

Adrien:

Yeah, but like, no matter what, like, what will happen is like, okay, we're gonna create a version of Cody that like runs on Aiven, right? And that app doesn't have any users, right? There won't be actual real like issues, right? Because it doesn't actually have any real users. And we're sure as fuck not gonna replace our production stack. So you have to protect either way, I guess.

Victor:

But you can, you can create a clone of the app and show a real issue that exists in the real app and just fix it in the clone.

Adrien:

Oscar, you're not saying anything.

Victor:

For example, you can say, well, hey, we have 3 design systems currently, can you go and replace all the purple buttons with, you know, something else?

Adrien:

But that's just called code.

Victor:

Okay, how do you, how do you like for real leverage the preview? What, what are you like—

Adrien:

Services, new functionality, things that require database schema changes, uh, or like new services Like, hey, I want to add an email outbound flow to like when someone sends an email, submits their email in my website, please send them blah blah blah. Okay, let me go set up the— okay, well, you start with a bare marketing website, okay? It's just like a page, and then you're like, hey, like, I want to like, you know, get the users to submit their details and then send them an email that it's been received and get up to Calendly and whatever. You progressively enhance like this shitty marketing website as like a non-commercial person and then show like the engineering workflow on the other side as like the demo.

Victor:

Okay, you have an example in mind of a specific thing you want to enhance?

Adrien:

That is one of them.

Victor:

I like the— well, this is again, it's a real thing we have, right?

Adrien:

So I want to add a headless CMS for the blog.

Victor:

Something that needs real infrastructure, right?

Adrien:

Yeah.

Victor:

Yeah.

Adrien:

Probably a database. Okay.

Victor:

This thing doesn't even have a schema, right?

Adrien:

Right. Yeah. Well, I don't know. Oh, I've never worked with a headless CMS, though we will have to figure this out for the marketing website. So this could be a great Yeah, use of time. Okay, Oscar, what do you think? Say some words.

Oscar:

Not compelled. I think— I mean, one thing that comes to mind is the problem— a problem we're running into is not being able to clone the app because the infrastructure. What if we made a thing that made your portable.

Adrien:

This cannot be solved like generally though.

Oscar:

Well, it can with AI.

Victor:

What do you mean, why not?

Adrien:

Okay, I see what you're saying. So like migrate any app onto Aiven to make it fully clonable.

Oscar:

Yeah, and then there's all sorts of use cases like the one we described. Actually, a lot of the use cases are like Cloud coding slash—

Victor:

What you can do is you're like, oh hey, we had this app on GCP and whatever, we ran out of credits, or AWS launched this amazing thing and we want to migrate everything to AWS, and then like wink wink, they're sponsors.

Adrien:

Okay, wait, so the The problem and solution is basically this. Sign up. Well, okay, here's like the UX or I guess the demo. It's like sign up, connect your GitHub, point it at the monorepo. The agent churns for 24 hours and like completely migrates you to like, you know, the Aiven stack. Okay.

Victor:

Lots of agents because they have Kafka and then put all the messages.

Adrien:

And then once that's done, then now your app is like Aivenified and now you have like a fork functionality with like a very nice UX, just like fork app and then it app editor on top of it.

Victor:

Oh, you want to merge the two?

Adrien:

Yeah.

Victor:

Did you want to merge the two?

Adrien:

Not necessarily, but otherwise what's the point in doing this? Like, the point—

Victor:

Because this is like two distinct pieces, right?

Adrien:

The point of forking it was that you can then like use the Aiven MCP to like, yeah, just like I like that it applies to any app that doesn't have Aiven, right?

Victor:

Because the precondition is—

Adrien:

here's like a thing that lets any customer, anyone become your customer.

Victor:

Yeah.

Adrien:

All right. It's kind of Aiven, Aivenify.

Victor:

Yeah. Oh yeah, it was .fi domain. Oh, Aiveny.fi. Yeah.

Adrien:

I think this could be good.

Victor:

I mean, it's like it's almost at the kind of— it's too— how did you call it? Solution-oriented?

Adrien:

No, I don't think so.

Victor:

OK. But this is a separate thing, right?

Adrien:

Because the if if we then go, so can you believe we just took this fucking room?

Victor:

Can you can you we just walked in. Can you take a picture of us and then the huge room?

Adrien:

Can you believe we just walked in here? We're like okay, this will do. Here we are.

Victor:

Okay, so to recap, take any up. And then, uh, even— how do you spell it? A-I-V-E-N?

Adrien:

A-I-V-E-N. Yeah, evenify.

Victor:

Fuck, if that domain is, is available, you know. No, no, no, I guess because we're in Finland and .fy is the Finnish domain.

Adrien:

Oh, even.fi.

Oscar:

Yeah.

Adrien:

Even if I?

Victor:

Even if I?

Adrien:

Where's the if I? You have even if I. Fuck.

Victor:

So you want ify and then dot something. Even if I dot run.

Adrien:

Or you can just have Aiven.fi, or you can just have Aiveni.fi.

Victor:

Anyway, not important. So take any app, which is a GitHub.

Adrien:

Yeah, move it onto the Aiven stack.

Victor:

Like, hopefully, you know, it informs us about your infrastructure as code. It moves to— well, you need a destination cloud, right?

Adrien:

I don't know yet. I don't know how Aiven works. Okay.

Victor:

Supposedly some AWS credits, amazing. So it's like, okay, fantastic. Well, we got some AWS.

Adrien:

Yeah, okay. Yeah, yeah, Koliib runs on GCP and now—

Oscar:

Yeah, you know what else would have been useful? What if this is what you said earlier, or like yesterday. If while we were speaking, it was doing research on all this stuff for us and it validated or disproved our idea, as in the recording, you know, now we could go— we just had a question, we could go look at the thing and it would just be like, yeah, you can do that.

Victor:

What thing?

Oscar:

This thing. So it listens in, right? WhisperFlow. whatever, and it does research as you speak.

Adrien:

Okay.

Oscar:

And it just surfaces answers for you.

Adrien:

I mean, fully agree, that'd be cool.

Victor:

But that was the idea number 2 now.

Oscar:

Yeah.

Adrien:

But how— this doesn't really link into the tracks.

Oscar:

I'm not really thinking about that. Well, ElevenLabs.

Adrien:

Yeah, but that's a side track.

Oscar:

It doesn't have to They're all shitty tracks, let's be real. Like, none of these make any sense as like actually innovative or interesting products.

Adrien:

They brought us here for this?

Oscar:

Yeah, I'm not— I'm really not impressed by the tracks, I have to say. Yeah, I liked the tracks at BASE.

Adrien:

I mean, if we want to dual wield, we can also just, you know, while we, while we change your codebase, we also put you on the, the distributed Git bullshit.

Victor:

Mm, your codebase cannot be erased ever.

Adrien:

Yeah, and also it's public.

Victor:

And now it's public. Congrats.

Adrien:

Don't worry about that, it's fine. Build in the open.

Oscar:

Open source.

Adrien:

Open source, yeah, literally. OpenSource.me.

Victor:

Wow. Cool.

Adrien:

Still not— we need a more compelling vision.

Victor:

Okay, I like Avenue5 because I think it's very straightforward and we can actually make it in a day.

Adrien:

Okay, so it should— but Aivenify is literally like just fucking, you know, Claude code plus MCP tools.

Victor:

I think the solution doesn't have to be impressive, the demo has to be impressive. And it has to solve a real problem. Like what the dude did was a fucking screenshot. It's, you know, solution is not impressive.

Adrien:

The thing is we won't be able to demo this in real time.

Victor:

Lucio, you wrote the— have you tried fast models?

Adrien:

It doesn't like matter. Like—

Victor:

It can be— oh wait, you have 4 minutes. Yeah, you can take Spark, you can take Groq, you can take—

Adrien:

Spark is retarded. Spark is actually—

Victor:

I don't think there is a lot of mental capacity to do this sort of stuff.

Adrien:

100% disagree. Yeah, try to remove SQS from our stack.

Victor:

No, no, we're not talking about our stack, we're talking about some sort of, uh, it's a demo, right? So your app is a freaking Next.js app, the most vulnerable thing possible.

Adrien:

Oh, so now we're back to not our app.

Victor:

It's Ivenify.

Adrien:

Okay.

Victor:

I like your idea. It's a stupid marketing website where a commercial person wants to add commercial stuff, right? It's very plausible they want to add email sequences. Okay.

Adrien:

Okay. So what's—

Victor:

Or push this to a CRM, right? So you like, what you need is you need to connect some sort of ActiveMCP, Or yeah, store credentials somewhere plus connect email thingy or headless CMS. It's amazing because you probably need to run headless CMS in the container. So we need the container.

Adrien:

Yeah. Right.

Victor:

So you have a stupid website.

Adrien:

Oh no, it's just on Vercel now.

Victor:

No, Vercel, no, no, no. It has to be Aiven because otherwise there's no Aiven, he's not doing anything.

Adrien:

Oh, I see. So you're moving the Vercel workloads to Aiven as well?

Victor:

There's no Vercel, I think. No Vercel at the start, no Vercel at the finish for now.

Oscar:

So where is the website deployed?

Adrien:

Hmm? So how does it work initially?

Victor:

I don't know, it's on FTP or something. What?

Adrien:

It's still deployed somewhere.

Victor:

Oh no, on Google Pages, you know, the thing. Because you connect your GitHub repo Right?

Oscar:

Or what's the difference between Google Pages and Vercel?

Victor:

What's the difference?

Adrien:

Like, it's deployed somewhere.

Victor:

One is free.

Oscar:

They're both free. Vercel is free. Don't, don't, don't be silly.

Adrien:

Don't be silly.

Victor:

Okay, but we cannot take Vercel and move it to somewhere else because Vercel will not be happy with us.

Adrien:

We can move it to AWS. We will be happy. AWS will be happy. Aiven will be happy. Yeah, who else will be happy? Anthropic?

Victor:

I mean, if you move it to the server that we get out, then the other one will be happy as well.

Adrien:

Okay, we have to have like a powered by Claude in there somewhere. You know, it's an AI agent.

Oscar:

Dude, I should get my Codex hat.

Adrien:

Oh, and we can just like fork the Pi Harness and then we put an AI agent with clubs. Yeah.

Victor:

Okay, so, okay, let's recap the thing that we like is take any app supposedly deployed somewhere that's not—

Adrien:

Yeah, let's put it on GCP. Yes, it's just built like a—

Victor:

So you have like a weird marketing x engineering collab where marketing designed a slow mocking website but then it got deployed on GCP. But wait, AWS has this like stupid thing for one-click deploy of your app, right? That we don't use. It's like, I think it's like a Vercel alternative.

Adrien:

Oh, like Amplify?

Victor:

Yeah, yeah, something like this, right? So GCP for sure has this like, uh, just connect your repo and it will auto-deploy and push to main.

Adrien:

Maybe.

Victor:

I don't know.

Adrien:

Okay, we can go validate some assumptions.

Victor:

Cool. So one, take any app, deploy it on GCP, which we currently dislike, or Oracle Cloud.

Adrien:

I love GCP, but no, no, I think just any cloud. Um, but we'll demo with GCP just so we can move it to AWS and for AWS to be like, cool.

Victor:

I don't know, deploy it on Hetzner. We have a Hetzner VPS.

Adrien:

Sure.

Victor:

We're like, look, this, this thing, marketing person cannot touch. They don't know how to log into a VPS. So, you know, we need to move it off of there and into somewhere where— okay, deploy it on bare metal. That's it for the proper geeks.

Adrien:

I don't know. Well, it's not come across as over-engineered. Like, you should just— you should just ship it to Vercel.

Victor:

Okay, how do you—

Adrien:

Right, but like before you have to use like fucking PlanetScale and whatever the fuck.

Victor:

Yes, cool. Can you use Aiven to, to split it up and move the Next part to Vercel and then the, uh, um, the container— containerized the, what's it called, the headless CMS.

Adrien:

Yeah, you don't need to containerize it, no?

Victor:

Well, you do need some infrastructure that Aiven's gonna handle, right? Because it won't—

Adrien:

Yeah, you need a database.

Victor:

Yeah.

Adrien:

If we want to do emailing, we can use Kafka.

Victor:

Amazing, we're able to process 1 trillion messages per second. Yeah, I think it's a good joke. We should— yeah, we can, we can totally over-engineer this part because he mentioned Kafka at least 3 times.

Adrien:

Yeah, we can make a joke about it.

Victor:

He wants Kafka there.

Adrien:

We can tell him, you know, just— and for Stan, we made our email support over 1 trillion TPS, yes. TPS because, okay, you know, in case everyone in the world tries to sign up at once a thousand times. Yes.

Victor:

Is it a durable queue?

Adrien:

I don't know, I've never used Kafka. Amazing.

Victor:

All right, so that is sorted. So it goes to Vercel.

Adrien:

You can have like search as well. What services does even?

Victor:

What was the? Can you open the schedule? What was the schedule?

Adrien:

Get out of here. Um, the sauna opens and then there's dinner at seven, and then mentoring hour at eight thirty.

Victor:

Yeah, that's all we need.

Adrien:

Okay. Hello.

Victor:

Hi.

Adrien:

Goodbye. So to recap, I still think after we Aivenify it, then Which is— Aivenification permits many things.

Victor:

Yes.

Adrien:

There are many reasons you should do this, including—

Victor:

Okay, but we're focusing on enablement for commercial, right?

Adrien:

Yeah.

Victor:

So we kind of want a little nice— No, it's just nice. Okay, the accent commercial.

Adrien:

Full stack. Yeah, full stack Aivenification has many benefits, including but not limited to Forking development environments from production so that you can produce things. You can do a little CLI.

Victor:

What do we call it? Evanify deploy dot, and then it deploys the current—

Adrien:

Just call it Aiven, I-V-A-N, or Van. Van drive, van fork, van life.

Victor:

I like that.

Adrien:

Oh, van life. Should we call our thing vanlife.ai?

Victor:

Vanlife.ai. I'm pretty sure it's taken, especially .ai.

Adrien:

Yeah, probably.

Victor:

So when—

Adrien:

maybe van.life? Van.life?

Victor:

That's going to be very expensive. Okay, but we don't have to buy the domain.

Adrien:

We don't actually Yeah, uh, cool.

Victor:

So you do— developers do van— what's, what's the push analog for?

Adrien:

Van fork.

Victor:

One run.

Adrien:

Van fork. Van run.

Victor:

One preview.

Adrien:

Van preview.

Victor:

Yeah, because the cool part is you You don't need the local infrared. You can spin up the— because what you want is you want the thing like a shareable URL that you can share. No localhost.

Oscar:

Yeah.

Adrien:

You want Vercel DX for everything.

Victor:

Yeah.

Oscar:

That's cool.

Victor:

I mean, kind of stepping on Vercel's—

Adrien:

No, it's fine. Because we're going to be using Vercel under the hood as well.

Oscar:

Okay, cool.

Victor:

So you say van preview dot, and then it just goes and deploys current branch head to preview deployment, gives you a link, and then you give it to commercial and it's like, do you like this thing? Like, yeah, yeah, exactly. And then commercial can— can they go there and do stuff? Can they go and edit shit? like a little chat UI.

Adrien:

Oh, we can have Vant skills as well.

Victor:

What do they do?

Adrien:

Fork the ProdDB.

Victor:

Okay, well, what's the flow? What does commercial do? What does commercial want to do?

Adrien:

Okay, so there are—

Victor:

Yeah, I think in the demo, right, you're like, okay, developer has the local experience with CLI?

Adrien:

Let's walk through the experience end to end. Okay, so I am a developer at a shitty company with shit DX, and every time I want to make a change, like, it only runs locally and I have to have like my local resources, and there's some shared like cloud resources which make it really difficult to work on many things at once.

Victor:

And I'm looking for a solution to this problem and I'm like And they have 5 commercial people asking you random shit.

Adrien:

Yeah, 5 people fucking asking you to do shit.

Victor:

Can you make the font bigger?

Adrien:

They ask Claude, but every time they ask Claude to do something, like, the PR is shit because it doesn't actually work, and they can't test whether it works because they don't have like a local development setup. And so it's really painful, and I'm like, okay, I need to solve this problem, come on. So I find Aivenify, and it's like just like sign up, put your GitHub repo URL in, and just wait a little bit, and boom, you've got a new copy of your repo and you can just deploy it. And now you're like Vann CLI compatible, so you just press this shit, it will, you know—

Victor:

No way, hold on, no sign up, no nothing? You just do one init locally, right?

Adrien:

Yeah, sure, we can do that too. You know, that's good.

Victor:

Little curl van.live pipe sh and then—

Adrien:

Okay, okay. Yeah, yeah, I like that.

Victor:

And then you do the thing and then it's like, cool, like it has been vanified. Yeah, I vanified. Yeah. Okay, what's next?

Adrien:

Oh, and then we can have in staging, you can like wrap it with the van, the van provider which lets you edit it.

Victor:

Yeah, you need— because you need then the commercial editing experience, right?

Adrien:

Yeah.

Victor:

And so like you give them the preview link, they're like, they go there, they're like, oh, it's great, but I want, you know, make, make this picture larger.

Adrien:

Okay, okay, so fine. I go to van.life and I get a shell command that I run in my terminal, and then I just go van init and it will like launch— it will use my Claude Code to just like fucking— yes, I vanify this shit and I just—

Victor:

Yeah, it also detects your existing logins and it's like, hmm, let me use this, uh, ChatGPT Pro and alter things from cloud.

Adrien:

Yeah, yeah, okay, cool. And then, okay, so it's done this thing and I— there's a very simple way to deploy it and okay, we're live, great. And like, let's ignore the production data aspect of this because we can think about that later. Okay, great, now it's like ready to deploy, we deployed it. Now as a developer I can use van fork to like create a new workspace with fully like physically isolated resources so that I have effectively the same database state copied over in a new database, any other resources resources, any stateful resources, any non-stateful.

Victor:

But you have nothing for now.

Adrien:

Whatever I need, like boom, copied over. Um, and I can start, and I can get my coding agent to just go work on that. Um, and once it's done, it can, it can even get its— oh, there's a skill that the coding agent can use to like give its sub-agents the ability to further like clone and distribute work some more. Let's go like crazy if you want.

Victor:

Mm-hmm.

Adrien:

Okay, and then when it's done, then, you know, goes through the normal merge process, blah blah blah blah blah. That's the developer experience. I can also man deploy it, and then I can share like a link with my commercial team so that they can test that it's all nice and great, and then that's all good. And then as a commercial person, I can go onto any vanified app, whether it's the main app or it's a fork or whatever, and I can fork from the app itself, right? And what happens as a result? Well, now I'm just able to use a, you know, in-browser agent, whatever, to like edit this thing. It can set up like new infrastructure if it's needed. I can make my changes, I can visually preview them because it's just like, it's like an editable mode. And once I'm happy, I can, you know, submit it and then it creates a PR and voilà, c'est fait.

Victor:

Mm-hmm.

Adrien:

Yeah.

Victor:

Okay, and you can add a voice note from your commercial and use ElevenLabs, right?

Adrien:

Yeah, yeah, of course.

Victor:

It's like, yeah, hey developer, I've made some changes, please review.

Adrien:

Oh, maybe I want to deploy ElevenLabs as a sales agent on my website, you know.

Victor:

Yeah, it's like I don't want this boring Bookedemo thing. When you click Bookedemo, it should start, hmm, hey, would you like some Coloop?

Adrien:

Yeah, yeah, yeah, exactly right. Okay, great.

Victor:

All right, okay, there's many, there's many forks from this because we wanted to do other headless CMS, add email campaigns, add, um, voice agent. Yeah, which Which one are we demoing?

Adrien:

I think the voice agent is cap.

Victor:

Voice agent with, uh, when they, um, when they submit their details, it goes to CMS because then we need to use the Aiven for some, for something, for some inference.

Adrien:

Yeah, we need info. I think the headless CMS will need a database for sure.

Victor:

Yeah.

Adrien:

Cool. All right.

Oscar:

Okay.

Adrien:

I think this is like a good skeleton to start. We should probably go and creatively explore on top of these individually for like 25 minutes.

Victor:

I think, yeah, I want to do like a little screens of the demo.

Adrien:

Yeah.

Victor:

To see, like definitely like there has to be a lot of fun.

Adrien:

Huh?

Victor:

There has to be fun, like funny moments.

Adrien:

Oh yeah, yeah, for sure.

Victor:

Right.

Adrien:

So Oscar, what do you think?

Victor:

There has to be Kafka for email for sure.

Oscar:

Solid.

Adrien:

You bought in? Are you?

Oscar:

I'm not against it. I'm not against it.

Adrien:

You're skibbity doinking around. Come on, lock in, bro.

Oscar:

I am locked in. I gave the idea.

Victor:

Which one?

Oscar:

The migrating.

Adrien:

Ah yes, the founder with the idea.

Oscar:

Yeah, exactly, that's right. And now you guys do everything else and I take credit.

Victor:

And you take 3%.

Adrien:

Yeah, and then when you leave you ask for 750k. True. Yeah, that's great. That's how it should be.

Victor:

Sorry, what did we say? ElevenLabs agent, demo booking agent, plus headless CMS, plus DD.

Oscar:

Okay, I like this.

Victor:

Totally plausible use case.

Adrien:

Totally, totally. I mean, it's a real thing.
