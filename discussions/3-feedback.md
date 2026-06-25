Adrien:

Should I pitch?

Victor:

Sure.

Adrien:

Yeah, okay. So what we're trying to do is solve the problem of like— well, there's many interrelated problems, but fundamentally you have a team composed of commercial people and technical people, and ideally they would all be able to work on the same application and see behaviorally and visually when they've changed something that it works correctly and be able to debug production. So what we're thinking is you can take any app and Aivenify it, so move all of the stack, all the data stack over to Aiven so that you can clone databases, fork it, so that you can basically take your production, fork it, make safe changes there, see that everything works. You can have an AI agent embedded into that experience as well, so as a commercial person we can sort of produce like an editable clone of your actual production instance so that you can interact with it, you can see the changes, and then once you're happy, you can submit those for review and those can then be reviewed by an engineer. It also connects into the telemetry stack, all through the MCP, by the way, so that you can then— If there are slow queries, for example, you can use this figure out what's going wrong, test the changes again on an actual production dataset, and once you're happy, merge that in. If you have new features that you need to add that require new data stack components, then again, those can be deployed, and then once you're happy, those get also deployed to production.

Stan (Aiven):

Yeah.

Adrien:

So that's the rough overview. The one thing that would be super cool to have access to actually is the app preview that you guys are doing? You cannot give it yet.

Stan (Aiven):

I wish I could.

Adrien:

Because that would like—

Victor:

basically it will simplify a lot.

Stan (Aiven):

But the problem is like, can everyone—

Adrien:

Yeah, that's fair.

Stan (Aiven):

I get it.

Adrien:

I have it.

Stan (Aiven):

It's great. But the idea was that initially we were planning to have apps at this event.

Adrien:

Yeah.

Stan (Aiven):

And the development of apps took a bit longer than it was initially planned. That's why.

Adrien:

Okay. Yeah, because otherwise we'll use Vercel and their, like, I guess, deployments to—

Stan (Aiven):

Yeah, you can just link them together.

Adrien:

Yeah, exactly. Yeah. Do you have any feedback for us? What do you think?

Stan (Aiven):

Well, if you're gonna demo, maybe fake it a bit. The reason is right now, right now it's gonna be improved, but like if you fork a database, it takes like 5 to 6 minutes to spin up. So maybe what you could do because of that is have like a pre-run database and maybe move data there. I don't know if it's faster.

Adrien:

Yeah, yeah, yeah, okay, interesting. Yeah, or we can like pre-run the branch creation and then—

Stan (Aiven):

But you can't like— it's very easy to fork databases online.

Adrien:

Yeah, yeah, that was one of the interesting things. And like, I mean, all of this comes from actual like challenges that we've had internally where it's like we have given our commercial team access to Claude code and the codebase, but whenever they make significant changes, they can't see them. And our local development setup requires you to have AWS resources, and it's a real pain for them.

Stan (Aiven):

Even though on Postgres you can also have replicas.

Adrien:

Mm-hmm.

Stan (Aiven):

Okay.

Adrien:

Yeah, yeah.

Stan (Aiven):

But I don't know if it helps. But you can have like if you do the business plan, it has like two replicas. Okay. You can kind of read from those instead potentially.

Adrien:

Interesting.

Stan (Aiven):

Okay. But the idea makes sense.

Adrien:

How can I help? Um, well, that flow. The flag about the database replication was useful. I mean, we're gonna run into that, so we'll see. Yeah, do we have any thoughts?

Victor:

I guess, yeah, one thing. So we're gonna do preview deployments on Vercel, right? So that covers, I guess, Next frontend and server functions. What we ideally want is— it's not even that. It's the HMR from Next. So we need the agent to edit the actual code somewhere in the dev container and then show it, pipe it through to show it to whoever is doing the preview changes.

Adrien:

Yeah.

Victor:

I suppose you guys don't do dev containers. It's like you'll have to do everything on Vercel and just database via Aiven, right? Yeah, unfortunately.

Stan (Aiven):

I'm sorry about that.

Victor:

That's okay. Yeah, can you see a better way of doing this? Because we want, we want a live experience, right? Someone goes and like on the page, I don't know, highlights an element or like checks.

Stan (Aiven):

Give me a use case, like what would you want to show in the demo? Like there's a business person, what type of thing they would write in, let's say?

Adrien:

Yeah, yeah, see you guys soon. Yeah, see you. One is like adding a CMS for like a blog, adding functionality to collect emails and send out like a mailout.

Stan (Aiven):

It would be so, and then for that it would add a feature, it would add like make a change in the schema so there's a field for something, but then And then also update the Vercel app, whatever, right?

Adrien:

Exactly, yeah.

Stan (Aiven):

Okay, so like, it would be cool if the agent maybe it can decide based on the change. Yeah, is it like, should we just do it in prod?

Adrien:

Okay, shoot it.

Stan (Aiven):

Okay, do the fork and, uh, you know, I don't know if it makes sense, but you know, if it's like sometimes they change break or affect anything, and based on that, it can like— you can just do it. And sometimes it is— I don't know if it makes sense.

Adrien:

Yeah, yeah, yeah. So you kind of move fast and don't break things.

Victor:

If it's a copy change, then yes.

Adrien:

But yeah, yeah, yeah.

Stan (Aiven):

So because in Aiven, I think you can check the schemas as well, right? So you can like— the agent can plan.

Adrien:

The other thing, yeah, the other thing—

Stan (Aiven):

Should I fork and do like a safe, or should I just Which one? If it makes sense. If it's too complicated, you can just always close it.

Adrien:

Yeah, yeah, the other thing we're thinking, yeah, is adding like informational queries like, how does this work? Are there any events for this? What happens when the user clicks this button? This sort of stuff, which our commercial team does a lot of actually, and that works pretty well.

Stan (Aiven):

I don't know if it makes sense, but for me, like specifically for me, because I work with the context layer, like what would be cool is as the agent modifies schemas and stuff, that it like constantly, maybe in the comments of the tables or whatever, kind of keeps the context of like why it's doing this change.

Adrien:

Yeah.

Stan (Aiven):

So you're kind of like, they're just at the same level.

Adrien:

Documents.

Stan (Aiven):

Yeah, straight away within the database.

Adrien:

I see, I see. So does— so you— so Aiven reads like certain metadata from, from like the database, is that—

Stan (Aiven):

Well, no, in the database, in the table, like you can, when you for example create table, right?

Adrien:

Okay, so in the migrations. Yeah, yeah, in the migrations. Okay, yeah.

Stan (Aiven):

So then you could like— but I don't know if that makes sense. For me it's cool.

Adrien:

Okay, interesting.

Victor:

How do you guys— is it like a config sort of— how do you store? Is it like infrastructure as code type of things?

Adrien:

Well, top secret, Victor.

Victor:

As in, can I commit this? It's open source.

Adrien:

Is it?

Victor:

Or are you deploying open source?

Stan (Aiven):

What I meant is, maybe I'm wrong, or I think in PG. If I'm not wrong, when you create or you alter a table, you can store a comment inside the table, like for what it exists.

Adrien:

Yeah, metadata.

Stan (Aiven):

So essentially, you just— as users do stuff or the agent does stuff, you just tell it, hey, you You cannot just make a change. If you make a change straight in the database, you keep the context of why as a comment. So it kind of stores that in the database.

Adrien:

And your MCP leverages this?

Stan (Aiven):

I don't know if the MCP leverages it.

Victor:

Oh, so it just directly runs the migration on the thing?

Adrien:

Yeah, man. Just ship that thing. Raw, raw, raw dog. Oh, we can have like, uh, you know, like how, how you guys always ask me to run fucking queries.

Victor:

Yeah, I think it's a very niche problem for people who are here.

Adrien:

Oh, maybe.

Victor:

I think it's a bit of a problem for us, but yeah.

Adrien:

I think it's a problem. Well, I don't know how other companies solve this.

Victor:

Sounds like a gray area.

Stan (Aiven):

Where did Oscar go?

Victor:

But maybe there's like, I mean, maybe like what Zata did, right? If we can do, uh, copy and write an office state directly. If we can have like a state DB.

Adrien:

I mean, yeah, for— yeah, if we use something like this, it would actually— yeah, we couldn't just clone the prod DB. Also, cloning prod DB like doesn't scale very well if you have billions of records, but we don't have to worry about that for now.

Victor:

That's fine.

Adrien:

That's for Aiven. To figure out.

Stan (Aiven):

Yeah, so that's what I mean. When you do the DDL, right? Just add a column. Yeah. Some method. So the logic is I talk to an agent, it ends up working, but also you can talk and you don't buy. Chatting and gives additional context to what, so then you kind of always the agent on your behalf of the subject. And in terms of like what you can do. You can just, uh, you can just get the credentials. No, no, you get credentials and then you can just directly connect. Yeah, yeah, yeah. The only thing, don't maybe use VPC because then otherwise you have to figure out how to connect. So avoid doing that. And I would— well, actually, no, you won't have a problem. But I noticed, because in our projects, in my sandbox, I have a bunch of VPCs that often goes first to create a VPC. Oh, what the hell? It creates a database in the VPC.

Adrien:

Oh, I see.

Stan (Aiven):

Even though I didn't specify. But you don't have that.

Victor:

How do you guys? So is there like bring your own key for different providers, and then do you have managed or well BYOC?

Adrien:

I think yeah BYOC and managed, right?

Stan (Aiven):

So all the services on Island are managed. So if there's any way anytime an issue customers like tell us hey something broke or if we find that something broke or CPU is overused like an SRE will go.

Victor:

Okay, so by having access to you, we have access to AWS or any cloud provider. Yeah, so we don't have to set up that.

Stan (Aiven):

Well, the way Aiven works is you can do it in 2 ways. You can— when you create, it's a PG. Well, let me choose another. Sorry, let me go to one So when you create a, let's say, pg_writer, you can deploy to any of the clouds.

Adrien:

Yeah, yeah.

Stan (Aiven):

And then to any region, whatever. But we also support, which is like an extra thing, support bring your own cloud. So you have your own AWS account.

Adrien:

Yeah.

Stan (Aiven):

And we deploy it there. That makes sense. Sad you guys can't use apps. I know.

Adrien:

Yeah, we would have loved to.

Victor:

That would simplify a lot of things.

Adrien:

Aivenify.

Stan (Aiven):

Yeah, apps are pretty nice, I can share. Just because, you know, you can.

Adrien:

Just so we see what we're missing out on.

Stan (Aiven):

Anyway, so you literally— well, this is for Docker Compose files, but okay, I just have like some repo in GitHub and it checks the Dockerfile and it kind of— okay, it did this app, then it gets an app. But if there was a But if there was, uh, if there was like a Docker Compose that needs like PgA or Kafka, it would like auto-set everything up. For example. Well, for MCP it's actually cool. Like if I was working, basically what you're saying, yeah, it would like figure out, oh, I need to form this database and then I need to connect this app to this database and then do whatever I want. But unfortunately you cannot.

Adrien:

Yeah, our thing is going to be pure agent, like no schemas.

Stan (Aiven):

Like, I don't know, I build a dashboard that connects to ClickHouse. Wait, that is the wrong way. Like it actually goes where is my ClickHouse and gives me like live view of whatever like a base website. But I didn't have to do anything. It just said, hey, here's my ClickHouse building this. And then and in your case, what you're doing, it's like you would then have to find the report PG.

Adrien:

Yeah.

Stan (Aiven):

You would just send it there. Directly to ClickHouse, and the user can do whatever they want from there. Yeah, but really for like on-demand, you could like imagine that just use Purcell for— yeah, the same way, but I don't know, makes sense. But yes, maybe start with like most minimal use case, like start with like figuring out how to fork.

Adrien:

Yeah.

Stan (Aiven):

And then maybe you should optimize for cost because like we have like Postgres that costs $5 and Cosmos that costs like $1,000 per month.

Victor:

Yeah.

Stan (Aiven):

So you need to like optimize for $5.

Adrien:

I reckon we'll get away with cheap though.

Stan (Aiven):

Yeah, we have zero users. So you can also simulate users. You can run a mini app that like keeps— like that's what I have here. Like there's like a mini app that like constantly adds new rows to the database, like fake transactions. And then you can make the database pretty big.

Adrien:

Yeah, I mean, I guess you can also just write out Yeah, like a little script.

Victor:

Yeah, but it's like, yeah, like $5 Postgres.

Stan (Aiven):

Does Kafka do, uh, cron? Uh, so in Kafka we have—

Adrien:

by cron you mean that sends, uh, yeah, just on the timer, just spits it out.

Stan (Aiven):

We don't have that. We don't have that in Kafka. You have to set it up by UI. So when you have Kafka, you can do sample data stream. And then there's like 3 types of bacon inside. Some, some amount. So, ah, those are the same. Yeah, but that's also, yeah, that's also like part of it. What about you? What fast food are you different? I guess, and we will start there.

Adrien:

Fork and yeah.

Stan (Aiven):

Although I would think like again, I would think like maybe check what is faster to copy the data or to fork the whole database because what I mean is because then you can free deploy a database that is empty and send it to the database. Maybe you can have like a pool of copies of like the There is a—

Victor:

Does it start/stop? Does it do pg_dump or pg_restore?

Stan (Aiven):

The answer is probably. I haven't tried it myself, so I cannot tell you, but yes, most likely. How can I help you otherwise? technical feasibilities and everything.

Victor:

What do you think is impressive for people in this demo?

Stan (Aiven):

Yeah, well, the more you use the MCP for whatever you—

Victor:

No, not for you, for other people.

Stan (Aiven):

For other people? Yeah, do other people— So that it's just—

Victor:

Why do we have 2 presses?

Stan (Aiven):

Well, for our challenge we have 2 presses. Yeah, okay.

Victor:

So use those 2.

Stan (Aiven):

Is it like The use case you said makes a lot of sense, right? People from cowork or whatever, they don't know how to use anything and they want to work with production data. Here's a workflow that they don't even know what happens, but production works and they can even suggest changes.

Victor:

In the CMS case, not only they suggest, but also they can see what the agent did. that actually took the work to make are the ones that work the best.

Adrien:

And they're excellent products.

Victor:

Yeah, because if you just show the plot, okay, you know, we have a codebase connected to the plot, it opens the PR, but sometimes it's not good.

Stan (Aiven):

I don't know if it helps, but we have an item in the staging studio. It's kind of like in Like in Superbase, they have like an AI. Yeah, but I don't know, maybe you can— hopefully they use schema basically here and like ask, because it could like check, is it okay? Maybe the MCP is something.

Victor:

Yeah, the MCP or the agent will—

Stan (Aiven):

yeah, you don't need this for this.

Adrien:

All right, cool.

Stan (Aiven):

Okay, ship it.

Adrien:

Great, let's go. Thank you so much.
