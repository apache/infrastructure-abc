import * as ipnum from 'ip-num'

const blocklist_url = 'https://blocky.apache.org/all'

export const block_rules = {
  BL001: {
    title: 'More than 100,000 builds.apache.org visits per 12 hours',
    description: ''
  },
  BL002: {
    title: 'More than 2,500 rate-limited (code 429) responses not honored',
    description:
      'Many of our services make use of rate-limiting for compute or data intensive tasks, and will respond with a 429 HTTP response code (Too Many Requests).\nUsers of our services are expected to detect rate-limiting responses and act accordingly, slowing down their request rate.'
  },
  BL003: {
    title: 'More than 25,000 JIRA pageviews per hour',
    description: ''
  },
  BL004: {
    title: 'More than 200,000 pageviews on any box in a day (except svn)',
    description: ''
  },
  BL005: {
    title: 'More than 100,000 Confluence pageviews per day',
    description: ''
  },
  BL006: {
    title: 'More than 100,000 repository.a.o visits per day',
    description:
      'Neither repository.apache.org nor people.apache.org are general-purpose Maven repositories,\n' +
      'and should only be used for the testing of pre-production ASF code artifacts.\n' +
      '\n' +
      'Maven Central is the correct public Java artifact service - https://mvnrepository.com/repos/central If you have been blocked due to excessive use of repository.apache.org, please evaluate your\n' +
      'systems and update your configuration to use Maven Central, not repository.apache.org or\n' +
      'people.apache.org, and let us know the results of your investigation.\n' +
      '\n' +
      'We will then review the ban on your IP address.'
  },
  BL007: {
    title: 'More than 1,000 viewvc visits in a day',
    description: ''
  },
  BL008: {
    title: 'More than 5,000 BugZilla visits per day',
    description: ''
  },
  BL009: {
    title: 'More than 500 s.apache.org visits per day',
    description: ''
  },
  BL010: {
    title: 'More than 50GB traffic in a day',
    description: ''
  },
  BL011: {
    title: 'More than 25,000 visits to archive.apache.org within 24h',
    description:
      'The ASF software archive at archive.apache.org is designed to make older versions of ASF software available for occasional download.\n' +
      '\n' +
      'It is not meant to be used as a CI target for specific versions of our software.\n' +
      '\n' +
      'Please cache such artifacts locally if you expect to use them in a CI context, either on disk or through a caching proxy.'
  },
  BL012: {
    title: 'Excessive use of archive.a.o (>40GB per week)',
    description:
      'The ASF software archive at archive.apache.org is designed to make older versions of ASF software available for occasional download.\n' +
      '\n' +
      'It is not meant to be used as a CI target for specific versions of our software.\n' +
      '\n' +
      'Please cache such artifacts locally if you expect to use them in a CI context, either on disk or through a caching proxy.'
  },
  BL013: {
    title: 'BugZilla scraping (more than 800 requests in a single hour)',
    description: ''
  },
  BL014: {
    title: 'Openoffice Wiki scraping (more than 1000 requests in a single hour)',
    description: ''
  },
  BL015: {
    title: 'Suspicious Confluence traffic (more than 10 bad requests in 15min)',
    description: ''
  },
  BL016: {
    title: 'Abusive Confluence wiki scans, Apache Struts security bulletin',
    description: ''
  },
  BL017: {
    title: 'BugZilla scraping (more than 800 requests in a single hour)',
    description: ''
  },
  BL018: {
    title: 'Too many 404s on repository.a.o (bad CI configs looking for maven repos)',
    description:
      'Neither repository.apache.org nor people.apache.org are general-purpose Maven repositories, ' +
      'and should only be used for the testing of pre-production ASF code artifacts.\n' +
      '\n' +
      'Maven Central is the correct public Java artifact service - https://mvnrepository.com/repos/central\n' +
      '\n' +
      'If you have been blocked due to excessive use of repository.apache.org, please evaluate your ' +
      'systems and update your configuration to use Maven Central, not repository.apache.org or ' +
      'people.apache.org, and let us know the results of your investigation. \n\n' +
      'We will then review the ban on your IP address.'
  },
  BL019: {
    title: 'Too many 404s on people.a.o (bad CI configs looking for maven repos)',
    description:
      'Neither repository.apache.org nor people.apache.org are general-purpose Maven repositories, ' +
      'and should only be used for the testing of pre-production ASF code artifacts.\n' +
      '\n' +
      'Maven Central is the correct public Java artifact service - https://mvnrepository.com/repos/central\n' +
      '\n' +
      'If you have been blocked due to excessive use of repository.apache.org, please evaluate your ' +
      'systems and update your configuration to use Maven Central, not repository.apache.org or ' +
      'people.apache.org, and let us know the results of your investigation. \n\n' +
      'We will then review the ban on your IP address.'
  },
  BL020: {
    title: 'Too many 404s on Apache NetBeans BugZilla (buglist.cgi scraper)',
    description: ''
  },
  BL021: {
    title: 'Too many downloads via downloads.apache.org (more than 30,000 per day)',
    description: ''
  },
  BL022: {
    title: 'Poorly configured Scrapy instance that does not respect robots.txt',
    description: ''
  }
}

export async function fetch_blocklist() {
  const rv = await fetch(blocklist_url)
  const json = await rv.json()
  return json.block
}

export function to_cidr(ip_or_range) {
  ip_or_range = ip_or_range.trim() // remove any excess whitespace
  let cidr
  if (ip_or_range.search('/') === -1) {
    // If not in CIDR notation, convert to it
    if (ip_or_range.search(':') !== -1)
      ip_or_range += '/128' // IPv6
    else ip_or_range += '/32' // IPv4
  }
  if (ip_or_range.search(':') === -1) {
    // IPv4 range
    try {
      cidr = ipnum.IPv4CidrRange.fromCidr(ip_or_range)
    } catch {}
  } else {
    // IPv6 ??
    try {
      cidr = ipnum.IPv6CidrRange.fromCidr(ip_or_range)
    } catch {}
  }
  return cidr
}

// Borrowed from Apache Pony Mail (incubating):
const blockrule_re = new RegExp(/\b(BL\d\d\d)\b/, 'm')

export function fixup_urls(splicer) {
  /* Array holding text and links */
  let i, m, t, textbits, url, urls
  textbits = []

  /* Find the first link, if any */
  i = splicer.search(blockrule_re)
  urls = 0

  /* While we have more links, ... */
  while (i !== -1) {
    urls++
    /* Only parse the first 250 URLs... srsly */
    if (urls > 250) {
      break
    }

    /* Text preceding the link? add it to textbits frst */
    if (i > 0) {
      t = splicer.substring(0, i)
      textbits.push(t)
      splicer = splicer.substring(i)
    }

    /* Find the URL and cut it out as a link */
    m = splicer.match(blockrule_re)
    if (m) {
      url = `#${m[1]}`
      i = m[1].length
      t = splicer.substring(0, i)

      textbits.push(url)
      splicer = splicer.substring(i)
    }

    /* Find the next link */
    i = splicer.search(blockrule_re)
  }

  /* push the remaining text into textbits */
  textbits.push(splicer)
  return textbits
}
