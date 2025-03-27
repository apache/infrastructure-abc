const blocklist_url = 'https://blocky.apache.org/all';
let blocks = [];

const block_rules = {
    "BL001": {
        "title": "More than 100,000 builds.apache.org visits per 12 hours",
        "description": ""
    },
    "BL002": {
        "title": "More than 2,500 rate-limited (code 429) responses not honored",
        "description": "Many of our services make use of rate-limiting for compute or data intensive tasks, and will respond with a 429 HTTP response code (Too Many Requests).\nUsers of our services are expected to detect rate-limiting responses and act accordingly, slowing down their request rate."
    },
    "BL003": {
        "title": "More than 25,000 JIRA pageviews per hour",
        "description": ""
    },
    "BL004": {
        "title": "More than 200,000 pageviews on any box in a day (except svn)",
        "description": ""
    },
    "BL005": {
        "title": "More than 100,000 Confluence pageviews per day",
        "description": ""
    },
    "BL006": {
        "title": "More than 100,000 repository.a.o visits per day",
        "description": "Neither repository.apache.org nor people.apache.org are general-purpose Maven repositories,\n" +
            "and should only be used for the testing of pre-production ASF code artifacts.\n" +
            "\n" +
            "Maven Central is the correct public Java artifact service - https://mvnrepository.com/repos/central If you have been blocked due to excessive use of repository.apache.org, please evaluate your\n" +
            "systems and update your configuration to use Maven Central, not repository.apache.org or\n" +
            "people.apache.org, and let us know the results of your investigation.\n" +
            "\n" +
            "We will then review the ban on your IP address."
    },
    "BL007": {
        "title": "More than 1,000 viewvc visits in a day",
        "description": ""
    },
    "BL008": {
        "title": "More than 5,000 BugZilla visits per day",
        "description": ""
    },
    "BL009": {
        "title": "More than 500 s.apache.org visits per day",
        "description": ""
    },
    "BL010": {
        "title": "More than 50GB traffic in a day",
        "description": ""
    },
    "BL011": {
        "title": "More than 25,000 visits to archive.apache.org within 24h",
        "description": "The ASF software archive at archive.apache.org is designed to make older versions of ASF software available for occasional download.\n" +
            "\n" +
            "It is not meant to be used as a CI target for specific versions of our software.\n" +
            "\n" +
            "Please cache such artifacts locally if you expect to use them in a CI context, either on disk or through a caching proxy."
    },
    "BL012": {
        "title": "Excessive use of archive.a.o (>40GB per week)",
        "description": "The ASF software archive at archive.apache.org is designed to make older versions of ASF software available for occasional download.\n" +
            "\n" +
            "It is not meant to be used as a CI target for specific versions of our software.\n" +
            "\n" +
            "Please cache such artifacts locally if you expect to use them in a CI context, either on disk or through a caching proxy."
    },
    "BL013": {
        "title": "BugZilla scraping (more than 800 requests in a single hour)",
        "description": "Here we'll put a more detailed description of the issue and things..."
    },
    "BL014": {
        "title": "Openoffice Wiki scraping (more than 1000 requests in a single hour)",
        "description": ""
    },
    "BL015": {
        "title": "Suspicious Confluence traffic (more than 10 bad requests in 15min)",
        "description": ""
    },
    "BL016": {
        "title": "Abusive Confluence wiki scans, Apache Struts security bulletin",
        "description": ""
    },
    "BL017": {
        "title": "BugZilla scraping (more than 800 requests in a single hour)",
        "description": ""
    },
    "BL018": {
        "title": "Too many 404s on repository.a.o (bad CI configs looking for maven repos)",
        "description": "Neither repository.apache.org nor people.apache.org are general-purpose Maven repositories, " +
            "and should only be used for the testing of pre-production ASF code artifacts.\n" +
            "\n" +
            "Maven Central is the correct public Java artifact service - https://mvnrepository.com/repos/central\n" +
            "\n" +
            "If you have been blocked due to excessive use of repository.apache.org, please evaluate your " +
            "systems and update your configuration to use Maven Central, not repository.apache.org or " +
            "people.apache.org, and let us know the results of your investigation. \n\n" +
            "We will then review the ban on your IP address."
    },
    "BL019": {
        "title": "Too many 404s on people.a.o (bad CI configs looking for maven repos)",
        "description": "Neither repository.apache.org nor people.apache.org are general-purpose Maven repositories, " +
            "and should only be used for the testing of pre-production ASF code artifacts.\n" +
            "\n" +
            "Maven Central is the correct public Java artifact service - https://mvnrepository.com/repos/central\n" +
            "\n" +
            "If you have been blocked due to excessive use of repository.apache.org, please evaluate your " +
            "systems and update your configuration to use Maven Central, not repository.apache.org or " +
            "people.apache.org, and let us know the results of your investigation. \n\n" +
            "We will then review the ban on your IP address."
    },
    "BL020": {
        "title": "Too many 404s on Apache NetBeans BugZilla (buglist.cgi scraper)",
        "description": ""
    },
    "BL021": {
        "title": "Too many downloads via downloads.apache.org (more than 30,000 per day)",
        "description": ""
    },
    "BL022": {
        "title": "Poorly configured Scrapy instance that does not respect robots.txt",
        "description": ""
    }
}

async function fetch_blocklist() {
    const rv = await fetch(blocklist_url);
    const json = await rv.json();
    blocks = json.block;
    make_rule_accordion(document.getElementById('block_rules'));
}

function to_cidr(ip_or_range) {
    ip_or_range = ip_or_range.trim(); // remove any excess whitespace
    let cidr;
    if (ip_or_range.search("/") === -1) { // If not in CIDR notation, convert to it
        if (ip_or_range.search(":") !== -1) ip_or_range += "/128"  // IPv6
        else ip_or_range += "/32"  // IPv4
    }
    if (ip_or_range.search(":") === -1) { // IPv4 range
        try {
            cidr = ipnum.IPv4CidrRange.fromCidr(ip_or_range);
        } catch {

        }
    } else { // IPv6 ??
        try {
            cidr = ipnum.IPv6CidrRange.fromCidr(ip_or_range);
        } catch {

        }
    }
    return cidr;
}

// Borrowed from Apache Pony Mail (incubating):
const blockrule_re = new RegExp(/\b(BL\d\d\d)\b/, "m");

function fixup_urls(splicer) {

    if (typeof splicer == 'object') {
        return splicer;
        //splicer = splicer.innerText;
    }
    /* Array holding text and links */
    let i, m, t, textbits, url, urls;
    textbits = [];

    /* Find the first link, if any */
    i = splicer.search(blockrule_re);
    urls = 0;

    /* While we have more links, ... */
    while (i !== -1) {
        urls++;
        /* Only parse the first 250 URLs... srsly */
        if (urls > 250) {
            break;
        }

        /* Text preceding the link? add it to textbits frst */
        if (i > 0) {
            t = splicer.substring(0, i);
            textbits.push(t);
            splicer = splicer.substring(i);
        }

        /* Find the URL and cut it out as a link */
        m = splicer.match(blockrule_re);
        if (m) {
            url = `#${m[1]}`;
            i = m[1].length;
            t = splicer.substring(0, i);
            const linkel = document.createElement('a');
            linkel.href = url;
            linkel.innerText = m[1];
            linkel.className = 'blockrule';
            // show the accordion item
            linkel.addEventListener('click', () => {
                document.getElementById(`collapse_${m[1]}`).className="accordion-collapse collapse show";
                document.getElementById(`cb_${m[1]}`).className="accordion-button";
            })
            textbits.push(linkel);
            splicer = splicer.substring(i);
        }

        /* Find the next link */
        i = splicer.search(blockrule_re);
    }

    /* push the remaining text into textbits */
    textbits.push(splicer);
    return textbits;
}

function isArray(value) {
    return value && typeof value === 'object' && value instanceof Array && typeof value.length === 'number' && typeof value.splice === 'function' && !(value.propertyIsEnumerable('length'));
}

HTMLElement.prototype.inject = function (child) {
    let item, j, len;
    if (isArray(child)) {
        for (j = 0, len = child.length; j < len; j++) {
            item = child[j];
            if (typeof item === 'string') {
                item = document.createTextNode(item);
            }
            this.appendChild(item);
        }
    } else {
        if (typeof child === 'string') {
            child = document.createTextNode(child);
        }
        this.appendChild(child);
    }
    return child;
};

function is_blocked(e) {
    if (e) {
        if (e.key !== 'Enter') {
            console.log("moo")
            return
        } else {
            e.preventDefault();
        }
    }
    const ip = document.getElementById('ip_address').value;
    const cidr = to_cidr(ip);
    if (!cidr) {
        alert("Please input a valid IPv4 or IPv6 address or range.");
        return
    }
    console.log(`Checking block list for occurrences of ${ip}...`);

    document.getElementById('block_results_table').style.visibility = "visible";
    const bdiv = document.getElementById('block_results');
    bdiv.innerText = "";
    let c = 0;
    for (let block_entry of blocks) {
        let bcidr = to_cidr(block_entry.ip);
        if (bcidr.contains(cidr) || cidr.contains(bcidr)) {
            if (++c > 100) break
            const rdiv = document.createElement('tr');

            // block match
            const cidrdiv = document.createElement('th');
            cidrdiv.className = "cidrblock";
            cidrdiv.scope = "row";
            cidrdiv.innerText = block_entry.ip;
            rdiv.appendChild(cidrdiv);

            // timestamp
            const tdiv = document.createElement('td');
            tdiv.className = "timeblock";
            tdiv.innerText = new Date(block_entry.timestamp * 1000.0).toUTCString();
            rdiv.appendChild(tdiv);

            // reason
            const reasondiv = document.createElement('td');
            reasondiv.className = 'reasonblock';
            reasondiv.inject(fixup_urls(block_entry.reason));
            rdiv.appendChild(reasondiv);

            bdiv.appendChild(rdiv);
        }
    }
    if (bdiv.innerText === "") {
        document.getElementById('blockheads').style.visibility = "hidden";
        bdiv.innerText = "We could not find any entries matching your IP address or range. If you are certain you are blocked from our resources, please see the paragraph below about ";
        const dlink = document.createElement('a');
        dlink.innerText = "debugging connectivity issues";
        dlink.href = "#debug";
        bdiv.appendChild(dlink);
    } else {
        document.getElementById('blockheads').style.visibility = "visible";
    }
    return false
}

async function fill_ip() {
    const response = await fetch('https://api.ipify.org/?format=json');
    const data = await response.json();
    document.getElementById('ip_address').value = data.ip;
}


function make_rule_accordion(adiv, rules) {
    adiv.innerText = '';
    for (const [k, item] of Object.entries(block_rules)) {
        const idiv = document.createElement('div');
        idiv.className = "accordion-item";
        const hdiv = document.createElement('h2');
        hdiv.className = "accordion-header";
        hdiv.id = k;
        const bdiv = document.createElement('button');
        bdiv.className = "accordion-button collapsed";
        bdiv.id = `cb_${k}`;
        bdiv.type = "button";
        bdiv.dataset.bsToggle = "collapse";
        bdiv.dataset.bsTarget = `#collapse_${k}`;
        bdiv.style.fontWeight = "bold";
        const kbd = document.createElement('code');
        kbd.innerText = k;
        kbd.style.marginRight = '8px';
        const title = document.createTextNode(" " + item.title);
        bdiv.appendChild(kbd);
        bdiv.appendChild(title);
        const cdiv = document.createElement('div');
        cdiv.className = "accordion-collapse collapse";
        cdiv.dataset.bsParent = 'block_rules';
        bdiv.ariaExpanded = false;
        bdiv.ariaControls = `#collapse_${k}`;
        cdiv.id = `collapse_${k}`;
        idiv.appendChild(hdiv);
        hdiv.appendChild(bdiv);
        idiv.appendChild(cdiv);
        const tdiv = document.createElement('div');
        tdiv.className = "accordion-body";
        tdiv.innerText = item.description.length ? item.description : "No specific description is available for this rule at this time.";
        cdiv.appendChild(tdiv);
        adiv.appendChild(idiv);
        const advice = document.getElementById('general_block_advice').cloneNode(true);
        advice.style.display = "block";
        tdiv.appendChild(advice);
    }
}

document.getElementById('ip_address').addEventListener(`keypress`, is_blocked);
