import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { configuration } from '../configuration';
import { formatName } from '../utils';

export type NetworkArgs = {
  name: string;
  opts?: pulumi.ComponentResourceOptions;
};

export class Network extends pulumi.ComponentResource {
  public readonly network: gcp.compute.Network;
  public readonly subnet: gcp.compute.Subnetwork;
  public readonly connector: gcp.vpcaccess.Connector;
  public readonly router: gcp.compute.Router;
  public readonly staticIp: gcp.compute.Address;
  public readonly nat: gcp.compute.RouterNat;
  public readonly googleServicesRange: gcp.compute.GlobalAddress;
  public readonly privateServicesConnection: gcp.servicenetworking.Connection;

  constructor(args: NetworkArgs) {
    const name = formatName(args.name);

    super('base:Network', name, args.opts);
    const network = new gcp.compute.Network(
      formatName('vpc-network'),
      {
        project: configuration.gcpProject,
        autoCreateSubnetworks: false,
      },
      { parent: this }
    );
    const subnet = new gcp.compute.Subnetwork(
      formatName('vpc-subnet'),
      {
        project: configuration.gcpProject,
        network: network.id,
        ipCidrRange: '10.8.0.0/24',
        region: configuration.gcpRegion,
      },
      { parent: this }
    );
    const connector = new gcp.vpcaccess.Connector(
      formatName('vpc-connector'),
      {
        project: configuration.gcpProject,
        name: formatName('vpc-connector'),
        network: network.id,
        region: configuration.gcpRegion,
        ipCidrRange: '10.9.0.0/28',
      },
      { parent: this }
    );
    const router = new gcp.compute.Router(
      formatName('vpc-router'),
      {
        project: configuration.gcpProject,
        network: network.id,
        region: configuration.gcpRegion,
      },
      { parent: this }
    );
    const staticIp = new gcp.compute.Address(
      formatName('vpc-static-ip'),
      {
        project: configuration.gcpProject,
        region: configuration.gcpRegion,
      },
      { parent: this }
    );
    const nat = new gcp.compute.RouterNat(
      formatName('vpc-nat'),
      {
        project: configuration.gcpProject,
        router: router.name,
        region: configuration.gcpRegion,
        natIpAllocateOption: 'MANUAL_ONLY',
        natIps: [staticIp.id],
        sourceSubnetworkIpRangesToNat: 'ALL_SUBNETWORKS_ALL_IP_RANGES',
      },
      { parent: this }
    );

    const googleServicesRange = new gcp.compute.GlobalAddress(
      formatName('google-services-range'),
      {
        name: formatName('google-services-range'),
        project: configuration.gcpProject,
        purpose: 'VPC_PEERING',
        addressType: 'INTERNAL',
        network: network.id,
        address: '10.10.0.0',
        prefixLength: 24,
      },
      { parent: this, dependsOn: [network] }
    );

    const serviceNetworkingApi = new gcp.projects.Service('service-networking-api', {
      project: configuration.gcpProject,
      service: 'servicenetworking.googleapis.com',
      disableOnDestroy: false,
    });

    const privateServicesConnection = new gcp.servicenetworking.Connection(
      formatName('private-services-connection'),
      {
        network: network.id,
        service: 'servicenetworking.googleapis.com',
        reservedPeeringRanges: [googleServicesRange.name],
      },
      { parent: this, dependsOn: [googleServicesRange, serviceNetworkingApi] }
    );

    this.network = network;
    this.subnet = subnet;
    this.connector = connector;
    this.router = router;
    this.staticIp = staticIp;
    this.nat = nat;

    this.googleServicesRange = googleServicesRange;

    this.privateServicesConnection = privateServicesConnection;

    this.registerOutputs({
      network,
      subnet,
      connector,
      router,
      staticIp,
      nat,
      googleServicesRange: this.googleServicesRange,
      privateServicesConnection: this.privateServicesConnection,
    });
  }
}
