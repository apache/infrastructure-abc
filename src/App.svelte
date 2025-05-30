<script>
  import {
    Accordion,
    AccordionItem,
    Button,
    Card,
    CardBody,
    CardText,
    Col,
    Container,
    Row,
    Table
  } from '@sveltestrap/sveltestrap'

  import { block_rules, fetch_blocklist, to_cidr, fixup_urls } from './js/abuse.js'

  let blocks = []
  let ipAddress = $state('')
  let showBlockResults = $state(false)
  let blockingReasons = $state([])

  let activeBlockRule = $state(null)

  async function fill_ip() {
    await fetch('https://api.ipify.org/?format=json')
      .then((response) => response.json())
      .then((data) => (ipAddress = data.ip))
  }

  const is_blocked = (e) => {
    if (e) {
      if (e.key !== 'Enter') {
        console.log('moo')
        return
      } else {
        e.preventDefault()
      }
    }
    window.location.hash = ''
    const ip = ipAddress
    const cidr = to_cidr(ip)
    if (!cidr) {
      console.log(ip)
      alert('Please input a valid IPv4 or IPv6 address or range.')
      return
    }
    console.log(`Checking block list for occurrences of ${ip}...`)

    let results = []
    let c = 0
    for (let block_entry of blocks) {
      let bcidr = to_cidr(block_entry.ip)
      if (bcidr.contains(cidr) || cidr.contains(bcidr)) {
        if (++c > 100) break

        results.push(block_entry)
      }
    }

    blockingReasons = results
    showBlockResults = true
  }
</script>

<svelte:window
  onload={async () => {
    await fetch_blocklist().then((d) => {
      blocks = d
    })
  }}
  onhashchange={() => {
    if (window.location.hash) {
      activeBlockRule = window.location.hash.substring(1)
    } else {
      activeBlockRule = null
    }
  }} />

{#snippet blockResults()}
  {#if showBlockResults}
    {#if blockingReasons.length > 0}
      <Table responsive>
        <thead>
          <tr>
            <th class="w-25" scope="col">IP Address or Range</th>
            <th class="w-25" scope="col">Date blocked</th>
            <th class="w-75" scope="col">Reason for block</th>
          </tr>
        </thead>
        <tbody>
          {#each blockingReasons as block}
            <tr>
              <th class="cidrblock" scope="row">{block.ip}</th>
              <td class="timeblock">{new Date(block.timestamp * 1000.0).toUTCString()}</td>
              <td class="reasonblock">{@html fixup_urls(block.reason)}</td>
            </tr>
          {/each}
        </tbody>
      </Table>
    {:else}
      <p class="mt-4">
        We could not find any entries matching your IP address or range. If you are certain you are blocked from our
        resources, please see the paragraph below about <a href="#debug">debugging connectivity issues</a>.
      </p>
    {/if}
  {/if}
{/snippet}

{#snippet generalBlockAdvice()}
  <Card class="bg-warning-subtle m-1 p-2">
    <h6 class="card-title">General considerations when blocked</h6>
    <CardText>
      If you find yourself blocked from our services, consider the following questions as you determine how to address
      the situation:
    </CardText>
    <ul>
      <li>
        If you download a lot of software packages from us:
        <ul>
          <li>Are you downloading the same package(s) over and over for things like continuous integration?</li>
          <li>Have you considered using a caching forward proxy for these packages?</li>
        </ul>
      </li>
      <li>
        If you scrape or fetch data from us on a schedule, you may have been blocked to prevent service disruptions.
        Consider the following:
        <ul>
          <li>Are your data scrapers respecting robots.txt?</li>
          <li>Are you respecting 429 HTTP responses?</li>
        </ul>
      </li>
      <li>
        For all situations, consider:
        <ul>
          <li>
            How often do you <b>really</b>
            need to request data from ASF services, and how important is the freshness of data?
          </li>
          <li>
            Are there other ways you can get the needed data or information without over-encumbering ASF services?
          </li>
          <li>
            If the requests are spread out across an organization, have you considered having a central orchestrator of
            requests to help control the flow of traffic?
          </li>
        </ul>
      </li>
    </ul>
  </Card>
{/snippet}

<main>
  <Container class="p-0">
    <div class="px-2 py-2 my-2 text-center text-white">
      <h1 class="display-5 fw-bold">Abuse and Connectivity Issues at the ASF</h1>
      <div class="col-lg-11 mx-auto">
        <p class="lead mb-0 subtitle">
          The Apache Software Foundation provides a robust and extensive system for serving the needs of the Foundation,
          of our projects as they create and deploy product releases, and of people all around the world who wish to
          download and use those products. These services are free of charge; but we offer them with the assumption that
          everyone uses them appropriately. If you abuse the system by overloading it in one way or another, you make it
          harder for others to do what they need to do. The ASF Infrastructure team will take steps to prevent abuse and
          restore normal access to all who rely on the ASF.
        </p>
      </div>
    </div>
    <div class="px-2 my-3 text-center">
      <Button color="primary" class="mx-2" href="#blockcheck">check for block</Button>
      <Button color="primary" class="mx-2" href="#what">what to do if blocked</Button>
      <Button color="primary" class="mx-2" href="#debug">further troubleshooting</Button>
      <Button color="primary" class="mx-2" href="#rules">global block rules</Button>
      <Button color="primary" class="mx-2" href="#bots">bots and scrapers FAQ</Button>
    </div>
    <Row>
      <Col>
        <Card id="blockcheck">
          <CardBody>
            <h5 class="card-title">Have I been blocked?</h5>
            <p class="card-text">
              Enter your IP address to check if you have been added to our global block list, and why. You can also
              check your entire network block as well, by using CIDR notation, e.g.
              <kbd>123.123.123.0/22</kbd> or <kbd>2001:db8::/56</kbd>. If you don't know your public IP address, you can
              <a href={null} onclick={async () => await fill_ip()}>click here</a>
              to automatically determine it using a third party provider (IPify).
            </p>
            IP address or range:
            <input type="text" bind:value={ipAddress} onkeydown={is_blocked} />
            <Button color="primary" onclick={() => is_blocked()}>Search</Button>
            <br />
            <form>
              <div class="mb-3">
                {@render blockResults()}
              </div>
            </form>
          </CardBody>
        </Card>

        <Card id="what" class="mt-2">
          <CardBody>
            <h5 class="card-title">What to do if we have blocked you</h5>
            <p class="card-text">
              If a search for your IP or IP range yields a result in our block database, there are generally two ways
              forward:
            </p>
            <ol>
              <li>
                You can conform your usage of our resources and services to be within the acceptable range as laid out
                in our policies
              </li>
              <li>
                Explain why we should make an exception in your case. We do this <b>very rarely</b>. You need to explain
                (see below for instructions) how both you and we will benefit from this exception. Be prepared for us to
                say no.
              </li>
            </ol>

            <p class="card-text">
              Option one is straightforward and is what most users will want to look at. Each block entry has a
              <kbd>BLxxx</kbd> code that you can click to view details of the specific rule and its rationale, as well as
              (in some complex cases) steps for remediation.
            </p>
            <p class="card-text">
              The over-arching rule for all infractions is this: <b>don't cross the limits.</b>
            </p>

            <p class="card-text">
              When you have addressed the underlying cause of abuse (or wish to request an exception), contact
              <kbd>abuse@infra.apache.org</kbd> and provide the following information:
            </p>
            <ol>
              <li>
                The entity you are representing, either you as a private person or the corporation you are speaking on
                behalf of. If your corporation owns the ASN associated with the IP or IPs that we blocked, please
                mention the ASN as well.
              </li>
              <li>
                The IP or IPs that are being blocked. This can be a list of IPs or one or more ranges using CIDR
                notation.
              </li>
              <li>The rule that was broken (you can use the shorthand BLxxx reference if you wish).</li>
              <li>
                Any process-related context that you may wish to supply us, such as why we are seeing this influx of
                resource usage.
              </li>
              <li>
                The steps that you have taken to address the abuse on your side, or, in the case of requesting an
                exception, the rationale for said exception as well as why or how the ASF would benefit from our
                granting it.
              </li>
            </ol>

            Once we have received your request, we will process it and either remove the block right away or request
            additional information.
          </CardBody>
        </Card>

        <Card id="debug" class="mt-2">
          <CardBody>
            <h5 class="card-title">
              Troubleshooting connectivity issues: If you don't show as blocked, but you still cannot connect to our
              services
            </h5>
            <p class="card-text">
              The first step in troubleshooting external connectivity issues with the ASF is (and will always be) to run
              a trace-route tool on the hostname of the service you are trying to connect to.
            </p>
            <p class="card-text">
              Note: The <kbd>traceroute</kbd> tool may be called something else, like <kbd>tracert</kbd> on Windows.
            </p>
            <p class="card-text">
              Run the following in a command or terminal window:
              <kbd>traceroute <span class="text-danger">servicename.apache.org</span></kbd>, where
              <span class="text-danger">servicename.apache.org</span> is the hostname you are unable to connect properly
              to.
            </p>
            <p class="card-text">
              If the traceroute output indicates that you are being blocked at a certain point, you can use this
              information to find the proper data center or peering contact for resolving this issue.
            </p>
            <p class="card-text">
              For more in-depth information on how traceroute works, see the following external articles:
            </p>
            <ul>
              <li>
                <a href="https://www.varonis.com/blog/what-is-traceroute" target="_blank">
                  What is Traceroute? How it Works and How to Read Results
                </a>
                - by Varonis
              </li>
              <li>
                <a href="https://www.catchpoint.com/network-admin-guide/how-to-read-a-traceroute" target="_blank">
                  How to Read a Traceroute
                </a>
                - by Catchpoint
              </li>
            </ul>
            <p class="card-text">
              If the traceroute shows that there is no blockage, or that the blockage is with our ingress IP, and you do
              not find your IP address(es) listed in the "<a href="#blockcheck">Have I been blocked?</a>" directory,
              please reach out to us at <kbd>abuse@infra.apache.org</kbd> and we will help you further.
            </p>
          </CardBody>
        </Card>

        <Card id="rules" class="mt-2">
          <CardBody>
            <h5 class="card-title">Global block list rules employed by the ASF</h5>
            <p class="card-text">
              Below you'll find the general rules that govern our global, automatic blocking system. Click a rule to
              learn more about what it entails and why we perform these blocks.
            </p>

            <Accordion id="block_rules" stayOpen>
              {#each Object.entries(block_rules) as [k, item]}
                <AccordionItem active={activeBlockRule === k}>
                  <div slot="header" id={k}>
                    <code class="me-2">{k}</code>
                    {item.title}
                  </div>
                  <div>
                    {#if item.description.length > 0}
                      {item.description}
                    {:else}
                      No specific description is available for this rule at this time.
                    {/if}
                  </div>
                  {@render generalBlockAdvice()}
                </AccordionItem>
              {/each}
            </Accordion>
          </CardBody>
        </Card>

        <Card id="bots" class="mt-2">
          <CardBody>
            <h5 class="card-title">How we deal with bots and scrapers</h5>
            <p class="card-text">
              The ASF uses <a href="https://svn.apache.org/robots.txt">robots.txt</a>
              for managing scrapers and bots. We generally don't mind bots that respect <kbd>crawl-delay</kbd>
              settings, and you can request your robot user-agent be added to the allowed list, provided you can supply a
              reasonable argument for it. If you want your bot added to the allow-list, contact users@infra.apache.org.
            </p>
            <p class="card-text">
              We also employ ASN tracking in our global block system, and check for distributed scanners that belong to
              certain companies or data centers. Although our general block rules are made with single IP addresses in
              mind, we also block distributed abuse when we find it. Spreading your requests out over multiple IPs or
              data centers is not a valid excuse for abuse.
            </p>
            <p class="card-text">
              In general, be mindful of 429 HTTP response codes and consider your fellow people on this planet when you
              use our resources. We offer our services for free, with the understanding that people do not abuse them.
            </p>
          </CardBody>
        </Card>
      </Col>
    </Row>
  </Container>
</main>

<style>
  .subtitle {
    font-size: 1.08em;
  }
  .cidrblock {
    font-family: monospace;
    font-weight: bold;
    color: #124;
  }
  .reasonblock {
    font-family: sans-serif;
    font-weight: normal;
    color: #111;
  }
  .timeblock {
    font-family: sans-serif;
    font-weight: normal;
    color: #444;
  }
  .blockrule {
    font-family: monospace;
    font-weight: bold;
    color: #930;
  }
</style>
